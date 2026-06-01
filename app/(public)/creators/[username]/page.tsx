import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, ne, sql, asc } from "drizzle-orm";
import { Star, MapPin, Crown } from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, portfolioItems, savedCreators } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialStats } from "@/components/creator/social-stats";
import { PortfolioGallery, type GalleryItem } from "@/components/creator/portfolio-gallery";
import { SendMessageModal } from "@/components/brand/send-message-modal";
import { SaveCreatorButton } from "@/components/shared/save-creator-button";
import { TikTokEmbed } from "@/components/creator/tiktok-embed";
import { getTikTokEmbed } from "@/lib/utils/oembed";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { CREATOR_CATEGORIES, LANGUAGES } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const rows = await db
    .select({ displayName: creatorProfiles.displayName, bio: creatorProfiles.bio })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  if (!rows[0]) return { title: "Creator" };
  return { title: rows[0].displayName, description: rows[0].bio ?? undefined };
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
  const p = rows[0];
  if (!p) notFound();

  const items = await db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, p.id))
    .orderBy(asc(portfolioItems.sortOrder));

  const gallery: GalleryItem[] = items.map((i) => ({
    id: i.id,
    type: i.type,
    url: i.url,
    thumbnailUrl: i.thumbnailUrl,
    title: i.title,
  }));

  // Viewer = brand? → CTA + mentés állapot
  const brand = await getCurrentBrand();
  let initialSaved = false;
  if (brand) {
    const s = await db
      .select({ creatorId: savedCreators.creatorId })
      .from(savedCreators)
      .where(and(eq(savedCreators.brandId, brand.profile.id), eq(savedCreators.creatorId, p.id)))
      .limit(1);
    initialSaved = s.length > 0;
  }

  // Hasonló creatorok (azonos első kategória)
  let similar: CreatorCardData[] = [];
  const firstCat = p.categories?.[0];
  if (firstCat) {
    const sim = await db
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
          ne(creatorProfiles.id, p.id),
          sql`${creatorProfiles.categories} @> ${JSON.stringify([firstCat])}::jsonb`
        )
      )
      .limit(4);
    similar = sim.map((r) => ({
      ...r,
      categories: r.categories ?? [],
      isFeatured: r.isFeatured || r.isAdminFeatured,
    }));
  }

  // TikTok oEmbed (ha a creator megadott TikTok linket)
  const tiktokEmbed = p.tiktokUrl ? await getTikTokEmbed(p.tiktokUrl) : null;

  const isFeatured = p.isFeatured || p.isAdminFeatured;
  const langLabels = (p.languages ?? []).map(
    (l) => LANGUAGES.find((x) => x.value === l)?.label ?? l
  );

  return (
    <div className="space-y-8">
      {/* 1. HERO + 3. SOCIAL STATS (jobb oldal) */}
      <section className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-xl border bg-card">
          {/* kompakt borító — kb. fele a referenciának */}
          <div className="relative h-28 w-full dark-gradient">
            {p.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.bannerUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-5">
            <div className="-mt-12 flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card">
                <AvatarImage src={p.avatarUrl ?? undefined} alt={p.displayName} />
                <AvatarFallback className="text-xl">
                  {p.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{p.displayName}</h1>
              {isFeatured && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  <Crown className="mr-1 h-3.5 w-3.5" /> Kiemelt
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {p.averageRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{p.averageRating}</span>
                  <span>({p.reviewCount} értékelés)</span>
                </span>
              )}
              {p.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {p.city}
                  {p.county && p.county !== p.city ? `, ${p.county}` : ""}
                </span>
              )}
            </div>
            {p.categories && p.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.categories.map((c) => (
                  <Badge key={c} variant="secondary">
                    {CREATOR_CATEGORIES.find((x) => x.value === c)?.emoji}{" "}
                    {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
                  </Badge>
                ))}
              </div>
            )}
            {p.bio && (
              <blockquote className="mt-4 border-l-2 border-accent pl-4 text-lg font-medium">
                „{p.bio}"
              </blockquote>
            )}

            {/* CTA */}
            <div className="mt-5 flex flex-wrap gap-2">
              {brand ? (
                <>
                  <SendMessageModal toUsername={p.username} creatorName={p.displayName} />
                  <SaveCreatorButton creatorId={p.id} initialSaved={initialSaved} />
                </>
              ) : (
                <Button asChild>
                  <Link href="/login">Jelentkezz be a kapcsolatfelvételhez</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <h2 className="text-lg font-semibold">Közösségi platformok</h2>
          <SocialStats profile={p} />
        </aside>
      </section>

      {/* 2. BEMUTATKOZÁS */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nyelvek</CardTitle>
          </CardHeader>
          <CardContent>
            {langLabels.length ? (
              <div className="flex flex-wrap gap-1.5">
                {langLabels.map((l) => (
                  <Badge key={l} variant="outline">
                    {l}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nincs megadva.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eszközök</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {p.equipment && Object.values(p.equipment).some(Boolean) ? (
              <ul className="space-y-1">
                {p.equipment.phone && <li>📱 {p.equipment.phone}</li>}
                {p.equipment.camera && <li>📷 {p.equipment.camera}</li>}
                {p.equipment.microphone && <li>🎤 {p.equipment.microphone}</li>}
                {p.equipment.editing && <li>✂️ {p.equipment.editing}</li>}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nincs megadva.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* TikTok oEmbed beágyazás */}
      {tiktokEmbed?.html && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Kiemelt TikTok</h2>
          <TikTokEmbed html={tiktokEmbed.html} />
        </section>
      )}

      {/* 4. PORTFÓLIÓ */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Portfólió</h2>
        <PortfolioGallery items={gallery} />
      </section>

      {/* 5. ÉRTÉKELÉSEK (Modell A — a 7. fázisban) */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Értékelések</h2>
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Értékelést csak elfogadott együttműködés után lehet írni. A
          megjelenítés a 7. fázisban érkezik.
        </p>
      </section>

      {/* 6. HASONLÓ CREATOROK */}
      {similar.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Hasonló creatorok</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((c) => (
              <CreatorCard key={c.username} creator={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
