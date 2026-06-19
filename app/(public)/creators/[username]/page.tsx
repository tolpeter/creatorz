import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import {
  BadgeCheck,
  Camera,
  Clock,
  Crown,
  ExternalLink,
  Languages,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  brandProfiles,
  creatorProfiles,
  portfolioItems,
  profileViews,
  reviewResponses,
  reviews,
  savedCreators,
  users,
} from "@/lib/db/schema";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { activityLabel, getResponseStats } from "@/lib/creator-stats";
import { ProfessionalProfile } from "@/components/creator/professional-profile";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { CREATOR_CATEGORIES, LANGUAGES } from "@/lib/constants";
import { getTikTokEmbed } from "@/lib/utils/oembed";
import { supabaseOgImage } from "@/lib/utils/og-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarLightbox } from "@/components/creator/avatar-lightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialTile } from "@/components/creator/platform-icon";
import { Logo } from "@/components/layout/logo";
import { SocialStats } from "@/components/creator/social-stats";
import { PortfolioGallery, type GalleryItem } from "@/components/creator/portfolio-gallery";
import {
  TikTokVideoSlider,
  type TikTokSliderVideo,
} from "@/components/creator/tiktok-video-slider";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { SendMessageModal } from "@/components/brand/send-message-modal";
import { InviteToAdModal } from "@/components/brand/invite-to-ad-modal";
import { getInvitableAds, type InvitableAd } from "@/app/actions/invitations";
import { SaveCreatorButton } from "@/components/shared/save-creator-button";
import { ReportButton } from "@/components/shared/report-button";
import { RatingDistribution } from "@/components/shared/rating-distribution";
import { ReviewCard, type ReviewView } from "@/components/shared/review-card";

type Equipment = {
  phone?: string;
  camera?: string;
  microphone?: string;
  editing?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const rows = await db
    .select({
      displayName: creatorProfiles.displayName,
      bio: creatorProfiles.bio,
      avatarUrl: creatorProfiles.avatarUrl,
      bannerUrl: creatorProfiles.bannerUrl,
      city: creatorProfiles.city,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  const creator = rows[0];
  if (!creator) return { title: "Creator" };

  const description =
    creator.bio ??
    `${creator.displayName}${creator.city ? `, ${creator.city}` : ""} magyar UGC tartalomgyártó a Creatorzon.`;
  const image = creator.bannerUrl || creator.avatarUrl;

  return {
    title: creator.displayName,
    description,
    alternates: { canonical: `/creators/${username}` },
    openGraph: {
      type: "profile",
      title: `${creator.displayName} | Creatorz`,
      description,
      url: `/creators/${username}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${creator.displayName} | Creatorz`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const rows = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  const profile = rows[0];
  if (!profile) notFound();

  const [responseStats, activeRow, items] = await Promise.all([
    getResponseStats(profile.userId),
    db
      .select({ lastLoginAt: users.lastLoginAt })
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1),
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.creatorId, profile.id))
      .orderBy(asc(portfolioItems.sortOrder)),
  ]);

  const activity = activityLabel(activeRow[0]?.lastLoginAt ?? null);
  const gallery: GalleryItem[] = items.map((item) => ({
    id: item.id,
    type: item.type,
    // Fotóknál render-végponton át jelenítjük meg, hogy a böngésző által nem
    // támogatott formátumok (pl. .tiff) is megjelenjenek (JPEG/PNG-vé alakítva).
    url: item.type === "photo" ? supabaseOgImage(item.url, { width: 1200 }) : item.url,
    thumbnailUrl: item.thumbnailUrl
      ? supabaseOgImage(item.thumbnailUrl, { width: 800 })
      : null,
    title: item.title,
    description: item.description,
    categories: item.categories ?? [],
  }));

  const tiktokVideoEmbeds = await getTikTokVideoEmbeds(items);

  let brand: Awaited<ReturnType<typeof getCurrentBrand>> = null;
  try {
    brand = await getCurrentBrand();
  } catch {
    brand = null;
  }
  let initialSaved = false;
  let invitableAds: InvitableAd[] = [];
  if (brand) {
    const [saved, ads] = await Promise.all([
      db
        .select({ creatorId: savedCreators.creatorId })
        .from(savedCreators)
        .where(and(eq(savedCreators.brandId, brand.profile.id), eq(savedCreators.creatorId, profile.id)))
        .limit(1),
      getInvitableAds(profile.id),
    ]);
    initialSaved = saved.length > 0;
    invitableAds = ads;
  }

  // Profil-megtekintés rögzítése — MINDEN látogatótól (bejelentkezett vagy
  // anonim), és MINDEN megtekintés számít (nincs napi dedup: 5 megtekintés = 5).
  // Kivétel: a profil tulajdonosa saját magát nem növeli.
  try {
    const viewer = await getCurrentUser();
    const isOwner = viewer?.dbUser?.id === profile.userId;
    if (!isOwner) {
      void db
        .insert(profileViews)
        .values({
          creatorId: profile.id,
          viewerUserId: viewer?.dbUser?.id ?? null,
          brandId: brand?.profile.id ?? null,
          viewedDate: new Date().toISOString().slice(0, 10),
        })
        .then(
          () => {},
          () => {},
        );
    }
  } catch {
    // megtekintés-rögzítés best-effort
  }

  let similar: CreatorCardData[] = [];
  const firstCategory = profile.categories?.[0];
  if (firstCategory) {
    const similarRows = await db
      .select({
        username: creatorProfiles.username,
        displayName: creatorProfiles.displayName,
        avatarUrl: creatorProfiles.avatarUrl,
        city: creatorProfiles.city,
        categories: creatorProfiles.categories,
        instagramFollowers: creatorProfiles.instagramFollowers,
        instagramVerified: creatorProfiles.instagramVerified,
        tiktokFollowers: creatorProfiles.tiktokFollowers,
        tiktokVerified: creatorProfiles.tiktokVerified,
        isFeatured: creatorProfiles.isFeatured,
        isAdminFeatured: creatorProfiles.isAdminFeatured,
        averageRating: creatorProfiles.averageRating,
        reviewCount: creatorProfiles.reviewCount,
      })
      .from(creatorProfiles)
      .where(
        and(
          ne(creatorProfiles.id, profile.id),
          sql`${creatorProfiles.categories} @> ${JSON.stringify([firstCategory])}::jsonb`,
        ),
      )
      .limit(4);

    similar = similarRows.map((creator) => ({
      ...creator,
      categories: creator.categories ?? [],
      isFeatured: creator.isFeatured || creator.isAdminFeatured,
    }));
  }

  const reviewRows = await db
    .select({
      id: reviews.id,
      overallRating: reviews.overallRating,
      communicationRating: reviews.communicationRating,
      qualityRating: reviews.qualityRating,
      deadlineRating: reviews.deadlineRating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
      responseText: reviewResponses.text,
    })
    .from(reviews)
    .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
    .leftJoin(reviewResponses, eq(reviewResponses.reviewId, reviews.id))
    .where(and(eq(reviews.creatorId, profile.id), eq(reviews.hidden, false)))
    .orderBy(desc(reviews.createdAt));

  const reviewViews: ReviewView[] = reviewRows.map((review) => ({
    id: review.id,
    overallRating: review.overallRating,
    communicationRating: review.communicationRating,
    qualityRating: review.qualityRating,
    deadlineRating: review.deadlineRating,
    text: review.text,
    createdAt: review.createdAt,
    brandName: review.brandName,
    brandLogo: review.brandLogo,
    responseText: review.responseText,
  }));

  const isFeatured = profile.isFeatured || profile.isAdminFeatured;
  const isVerified = Boolean(profile.verified);

  // Kreatív szakember → portfólió-fókuszú, egyszerűbb layout
  if (profile.profileKind === "professional") {
    const similarPros = await db
      .select({
        username: creatorProfiles.username,
        displayName: creatorProfiles.displayName,
        avatarUrl: creatorProfiles.avatarUrl,
        city: creatorProfiles.city,
        professionalRoles: creatorProfiles.professionalRoles,
        averageRating: creatorProfiles.averageRating,
        reviewCount: creatorProfiles.reviewCount,
      })
      .from(creatorProfiles)
      .where(
        and(
          ne(creatorProfiles.id, profile.id),
          eq(creatorProfiles.profileKind, "professional"),
        ),
      )
      .limit(4);

    return (
      <ProfessionalProfile
        profile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          bannerUrl: safeImageUrl(profile.bannerUrl),
          bio: profile.bio,
          city: profile.city,
          county: profile.county,
          professionalRoles: profile.professionalRoles ?? [],
          specialties: profile.specialties ?? [],
          websiteUrl: profile.websiteUrl,
          instagramUrl: profile.instagramUrl,
          averageRating: profile.averageRating,
          reviewCount: profile.reviewCount,
          isFeatured,
          verified: isVerified,
        }}
        portfolio={items
          .filter((item) => item.externalUrl)
          .map((item) => ({
            id: item.id,
            externalUrl: item.externalUrl as string,
            title: item.title,
          }))}
        reviews={reviewViews}
        similar={similarPros.map((pro) => ({
          ...pro,
          professionalRoles: pro.professionalRoles ?? [],
        }))}
        isBrandViewer={Boolean(brand)}
        initialSaved={initialSaved}
        activity={activity}
        responseLabel={responseStats.label}
        invitableAds={invitableAds}
      />
    );
  }
  const languageLabels = (profile.languages ?? []).map(
    (language) => LANGUAGES.find((item) => item.value === language)?.label ?? language,
  );
  const equipment = normalizeEquipment(profile.equipment);
  const socialReachItems = [
    { url: profile.instagramUrl, count: profile.instagramFollowers },
    { url: profile.tiktokUrl, count: profile.tiktokFollowers },
    { url: profile.facebookUrl, count: profile.facebookFollowers },
    { url: profile.youtubeUrl, count: profile.youtubeSubscribers },
  ].filter(
    (item): item is { url: string; count: number } =>
      Boolean(item.url) && typeof item.count === "number" && item.count > 0,
  );
  const totalFollowers = socialReachItems.reduce((sum, item) => sum + item.count, 0);
  const videoCount = items.filter((item) => item.type === "video").length;
  const photoCount = items.filter((item) => item.type === "photo").length;
  const bannerImage = safeImageUrl(profile.bannerUrl);
  const tiktokHandle = profile.tiktokUrl ? getTikTokHandle(profile.tiktokUrl) : null;
  const primaryFollowers =
    typeof profile.tiktokFollowers === "number" && profile.tiktokFollowers > 0
      ? profile.tiktokFollowers
      : totalFollowers;

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#070807] text-white shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
        {bannerImage ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${bannerImage})` }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(163,230,53,0.32),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.14),transparent_24%),linear-gradient(135deg,rgba(0,0,0,0.55),rgba(0,0,0,0.9))]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(163,230,53,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.35) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.85fr)] lg:items-center lg:p-6">
          <div className="grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center sm:gap-4">
            <div className="relative">
              <AvatarLightbox src={profile.avatarUrl} alt={profile.displayName} />
            </div>

            <div className="min-w-0 text-left">
              <div className="flex flex-wrap justify-start gap-2">
                <Badge className="rounded-full bg-accent px-3.5 py-1 text-black hover:bg-accent">
                  {activity ?? "Magyar UGC creator"}
                </Badge>
                {isFeatured ? (
                  <Badge className="rounded-full bg-white px-3.5 py-1 text-black hover:bg-white">
                    <Crown className="h-3.5 w-3.5" />
                    Kiemelt profil
                  </Badge>
                ) : null}
                {isVerified ? (
                  <Badge className="rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-accent hover:bg-accent/10">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Hitelesített
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-2 flex min-w-0 flex-nowrap items-center justify-start gap-1.5 text-xl font-black leading-tight tracking-normal sm:mt-4 sm:flex-wrap sm:gap-2 sm:text-4xl lg:text-[2.55rem]">
                <span className="truncate">{profile.displayName}</span>
                {profile.tiktokUrl ? <SocialTile platform="tiktok" className="h-7 w-7 rounded-lg sm:h-8 sm:w-8" /> : null}
              </h1>

              <div className="mt-2 flex min-w-0 flex-wrap items-center justify-start gap-1.5 text-xs font-semibold text-white/74 sm:gap-2 sm:text-sm">
                <span className="truncate">@{profile.username}</span>
                {profile.city ? (
                  <>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                      {profile.city}
                      {profile.county && profile.county !== profile.city ? `, ${profile.county}` : ""}
                    </span>
                  </>
                ) : null}
              </div>

              {profile.categories?.length ? (
                <div className="-ml-[96px] mt-3 flex w-[calc(100%+96px)] flex-wrap justify-center gap-2 sm:ml-0 sm:mt-4 sm:w-auto sm:justify-start">
                  {profile.categories.slice(0, 3).map((category) => {
                    const Icon = CATEGORY_ICONS[category];
                    const label =
                      CREATOR_CATEGORIES.find((item) => item.value === category)?.label ??
                      category;
                    return (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur sm:px-3 sm:py-1.5 sm:text-sm"
                      >
                        {Icon ? <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" /> : null}
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : null}

              <div className="-ml-[96px] mt-4 flex w-[calc(100%+96px)] flex-wrap justify-center gap-2 sm:ml-0 sm:mt-5 sm:w-auto sm:justify-start sm:gap-3">
                {brand ? (
                  <>
                    <SendMessageModal
                      toUsername={profile.username}
                      creatorName={profile.displayName}
                    />
                    <InviteToAdModal
                      creatorId={profile.id}
                      creatorName={profile.displayName}
                      ads={invitableAds}
                    />
                    <SaveCreatorButton
                      creatorId={profile.id}
                      initialSaved={initialSaved}
                      className="h-10 rounded-xl border-white/20 bg-white/8 px-5 text-sm font-black text-white hover:bg-white hover:text-black sm:h-12 sm:px-7 sm:text-base"
                    />
                  </>
                ) : (
                  <Button asChild className="h-10 rounded-xl bg-accent px-5 text-sm font-black text-black hover:bg-accent/90 sm:h-12 sm:px-7 sm:text-base">
                    <Link href="/login">
                      <Users className="h-5 w-5" />
                      Követés
                    </Link>
                  </Button>
                )}
                {profile.tiktokUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-xl border-white/20 bg-white/8 px-5 text-sm font-black text-white hover:bg-white hover:text-black sm:h-12 sm:px-7 sm:text-base"
                  >
                    <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer">
                      TikTok profil <ExternalLink className="h-5 w-5" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className={profile.introVideoUrl ? "grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]" : ""}>
            {profile.introVideoUrl ? (
              <div className="overflow-hidden rounded-[1.25rem] border border-white/14 bg-black shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                    <Video className="h-3.5 w-3.5 text-accent" />
                    Intro
                  </span>
                </div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={profile.introVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  className="h-[170px] w-full bg-black object-cover"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 overflow-hidden rounded-[1.25rem] border border-white/12 bg-accent/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:grid-cols-4">
              <HeroMetric label="Követők" value={primaryFollowers ? formatCompact(primaryFollowers) : "0"} icon={<Users />} />
              <HeroMetric label="Videók" value={videoCount} icon={<PlayCircle />} />
              <HeroMetric label="Portfólió" value={items.length} icon={<Camera />} />
              <HeroMetric label="Értékelés" value={profile.averageRating ?? "0"} icon={<Star />} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Mobilon: Közösségi jelenlét közvetlenül a TikTok-blokk felett.
              (Desktopon ugyanez az oldalsávban — lásd lent, hidden lg:block.) */}
          {socialReachItems.length > 0 ? (
            <div className="lg:hidden">
              <SidePanel title="Közösségi jelenlét" icon={<Zap className="h-4 w-4" />}>
                <SocialStats profile={profile} />
              </SidePanel>
            </div>
          ) : null}

          {tiktokVideoEmbeds.length ? (
            <TikTokVideoSlider videos={tiktokVideoEmbeds} />
          ) : profile.tiktokUrl ? (
            <section className="rounded-[1.75rem] border border-black/10 bg-[#070807] p-6 text-white shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                    TikTok profil
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {tiktokHandle ? `@${tiktokHandle}` : "Creator TikTok csatorna"}
                  </h2>
                  <p className="mt-2 text-sm text-white/68">
                    A videós előnézet akkor jelenik meg sliderben, ha a creator TikTok videólinkeket is hozzáad a portfólióhoz.
                  </p>
                </div>
                <Button asChild className="rounded-full bg-accent font-black text-black hover:bg-accent/90">
                  <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer">
                    Megnyitás <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </section>
          ) : null}

          <ProfileSection
            eyebrow="Portfólió"
            title="Videófal és fotógaléria"
            description={`${videoCount} videó és ${photoCount} fotó alapján gyorsan átlátható a creator vizuális világa.`}
          >
            <PortfolioGallery items={gallery} />
          </ProfileSection>

          <ProfileSection
            eyebrow="Visszajelzések"
            title="Értékelések"
            description="Csak elfogadott együttműködés után érkezhet értékelés."
          >
            {reviewViews.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white p-8 text-center text-sm text-muted-foreground">
                Még nincs értékelés ennél a creatornál.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                <div className="rounded-[1.5rem] border border-black/10 bg-[#f6f7f2] p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">
                      {profile.averageRating ?? "n/a"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {profile.reviewCount} értékelés
                    </span>
                  </div>
                  <div className="mt-4">
                    <RatingDistribution reviews={reviewViews} />
                  </div>
                </div>
                <div className="space-y-4">
                  {reviewViews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>

          {similar.length > 0 ? (
            <ProfileSection
              eyebrow="Felfedezés"
              title="Hasonló tartalomgyártók"
              description="Ugyanebből a kategóriából ajánlott creator profilok."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {similar.map((creator) => (
                  <CreatorCard key={creator.username} creator={creator} />
                ))}
              </div>
            </ProfileSection>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Desktopon az oldalsávban; mobilon a bal oszlopban (lásd fent). */}
          {socialReachItems.length > 0 ? (
            <div className="hidden lg:block">
              <SidePanel title="Közösségi jelenlét" icon={<Zap className="h-4 w-4" />}>
                <SocialStats profile={profile} />
              </SidePanel>
            </div>
          ) : null}

          <SidePanel title="Bizalmi jelzések" icon={<ShieldCheck className="h-4 w-4" />}>
            <div className="space-y-2">
              {responseStats.label ? (
                <TrustRow icon={<Zap className="h-4 w-4" />} label={responseStats.label} />
              ) : null}
              {activity ? (
                <TrustRow icon={<Clock className="h-4 w-4" />} label={activity} />
              ) : null}
              {isVerified ? (
                <TrustRow
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Creator által hitelesített profil"
                />
              ) : null}
              {!responseStats.label && !activity && !isVerified ? (
                <p className="text-sm text-muted-foreground">
                  A bizalmi adatok a profil aktivitásával együtt frissülnek.
                </p>
              ) : null}
            </div>
          </SidePanel>

          {languageLabels.length > 0 ? (
            <SidePanel title="Nyelvek" icon={<Languages className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {languageLabels.map((language) => (
                  <Badge key={language} variant="outline" className="rounded-full px-3 py-1">
                    {language}
                  </Badge>
                ))}
              </div>
            </SidePanel>
          ) : null}

          {equipment.length > 0 ? (
            <SidePanel title="Eszközök" icon={<Camera className="h-4 w-4" />}>
              <div className="space-y-2">
                {equipment.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-[#f6f7f2] px-3 py-2"
                  >
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-right text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </SidePanel>
          ) : null}

          <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
            <ReportButton targetType="creator" targetId={profile.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}

async function getTikTokVideoEmbeds(items: typeof portfolioItems.$inferSelect[]) {
  const tiktokItems = items
    .filter((item) => item.type === "video" && isTikTokVideoUrl(item.url))
    .slice(0, 5);

  const embeds = await Promise.all(
    tiktokItems.map(async (item): Promise<TikTokSliderVideo | null> => {
      const embed = await getTikTokEmbed(item.url);
      // Könnyű előkép (thumbnail) — nem a nehéz iframe-et töltjük, így mobilon is
      // gyors, betölt és húzható. Ha nincs thumbnail, a kártya play-ikont mutat.
      return {
        id: item.id,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl ?? embed?.thumbnail_url ?? null,
        title: item.title ?? embed?.title ?? null,
        author: embed?.author_name ?? null,
      };
    }),
  );

  return embeds.filter((item): item is TikTokSliderVideo => Boolean(item));
}

function ProfileSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-[#fbfcf7] p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#65a30d]">
          {eyebrow}
        </p>
        <div>
          <h2 className="text-2xl font-black tracking-normal">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SidePanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-black">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0f4e5] text-[#4d7c0f]">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function HeroMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactElement<{ className?: string }>;
}) {
  return (
    <div className="min-h-[86px] border-white/10 bg-white/[0.035] p-2.5 text-center backdrop-blur first:border-0 odd:border-r even:border-r-0 sm:min-h-[104px] sm:border-l sm:p-3.5 sm:odd:border-r-0 lg:min-h-[112px] lg:p-4">
      <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center text-accent sm:h-8 sm:w-8 [&_svg]:h-7 [&_svg]:w-7 sm:[&_svg]:h-8 sm:[&_svg]:w-8">
        {icon}
      </div>
      <p className="text-xl font-black leading-none sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/72 sm:mt-1.5 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function TrustRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[#f6f7f2] px-3 py-2 text-sm font-semibold">
      <span className="text-[#65a30d]">{icon}</span>
      {label}
    </div>
  );
}

function normalizeEquipment(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const equipment = value as Equipment;
  return [
    { label: "Telefon", value: equipment.phone },
    { label: "Kamera", value: equipment.camera },
    { label: "Mikrofon", value: equipment.microphone },
    { label: "Vágás", value: equipment.editing },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function isTikTokVideoUrl(url: string) {
  return /tiktok\.com/i.test(url) && /\/video\/|vm\.tiktok\.com|vt\.tiktok\.com/i.test(url);
}

function getTikTokHandle(url: string) {
  const match = url.match(/@([^/?#]+)/);
  return match?.[1] ?? null;
}

function safeImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }
  return null;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
