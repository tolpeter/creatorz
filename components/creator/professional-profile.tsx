import Link from "next/link";
import {
  MapPin,
  Star,
  Crown,
  BadgeCheck,
  Globe,
  Clapperboard,
  Clock,
  Zap,
} from "lucide-react";
import { SocialTile } from "@/components/creator/platform-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SendMessageModal } from "@/components/brand/send-message-modal";
import { SaveCreatorButton } from "@/components/shared/save-creator-button";
import { ReportButton } from "@/components/shared/report-button";
import { PortfolioEmbed } from "@/components/shared/portfolio-embed";
import { ReviewCard, type ReviewView } from "@/components/shared/review-card";
import { RatingDistribution } from "@/components/shared/rating-distribution";
import { PROFESSIONAL_ROLES } from "@/lib/constants";

export type ProfessionalPortfolioItem = {
  id: string;
  externalUrl: string;
  title: string | null;
};

export type SimilarProfessional = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  professionalRoles: string[];
  averageRating: string | null;
  reviewCount: number;
};

export type ProfessionalProfileData = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  city: string | null;
  county: string | null;
  professionalRoles: string[];
  specialties: string[];
  websiteUrl: string | null;
  instagramUrl: string | null;
  averageRating: string | null;
  reviewCount: number;
  isFeatured: boolean;
  verified: boolean;
};

export function roleLabel(value: string): string {
  return PROFESSIONAL_ROLES.find((r) => r.value === value)?.label ?? value;
}

/**
 * Kreatív szakember (videóvágó / fotós / operatőr) publikus profil:
 * hero + bemutatkozás + beágyazott portfólió + értékelések + hasonló alkotók.
 */
export function ProfessionalProfile({
  profile,
  portfolio,
  reviews,
  similar,
  isBrandViewer,
  initialSaved,
  activity,
  responseLabel,
}: {
  profile: ProfessionalProfileData;
  portfolio: ProfessionalPortfolioItem[];
  reviews: ReviewView[];
  similar: SimilarProfessional[];
  isBrandViewer: boolean;
  initialSaved: boolean;
  activity: string | null;
  responseLabel: string | null;
}) {
  return (
    <div className="space-y-8 pb-8">
      {/* 1. Hero */}
      <section className="relative overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#070807] text-white shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
        {profile.bannerUrl ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${profile.bannerUrl})` }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(163,230,53,0.32),transparent_30%),linear-gradient(135deg,rgba(0,0,0,0.55),rgba(0,0,0,0.9))]"
        />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="h-[120px] w-[120px] shrink-0 border border-accent/40 ring-4 ring-accent/18">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
              <AvatarFallback className="bg-white text-3xl font-black text-black">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-accent px-3.5 py-1 text-black hover:bg-accent">
                  <Clapperboard className="h-3.5 w-3.5" />
                  Kreatív szakember
                </Badge>
                {profile.isFeatured ? (
                  <Badge className="rounded-full bg-white px-3.5 py-1 text-black hover:bg-white">
                    <Crown className="h-3.5 w-3.5" />
                    Kiemelt profil
                  </Badge>
                ) : null}
                {profile.verified ? (
                  <Badge className="rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-accent hover:bg-accent/10">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Hitelesített
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-3 truncate text-2xl font-black leading-tight sm:text-4xl">
                {profile.displayName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/74">
                <span>@{profile.username}</span>
                {profile.city ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    {profile.city}
                    {profile.county && profile.county !== profile.city
                      ? `, ${profile.county}`
                      : ""}
                  </span>
                ) : null}
                {profile.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {profile.averageRating} · {profile.reviewCount} értékelés
                  </span>
                ) : null}
              </div>

              {/* Szerepkör badge-ek */}
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.professionalRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-black"
                  >
                    {roleLabel(role)}
                  </span>
                ))}
              </div>

              {(responseLabel || activity) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {responseLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      <Zap className="h-3.5 w-3.5" />
                      {responseLabel}
                    </span>
                  )}
                  {activity && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      <Clock className="h-3.5 w-3.5" />
                      {activity}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {isBrandViewer ? (
                  <>
                    <SendMessageModal
                      toUsername={profile.username}
                      creatorName={profile.displayName}
                    />
                    <SaveCreatorButton creatorId={profile.id} initialSaved={initialSaved} />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white"
                  >
                    Jelentkezz be a kapcsolatfelvételhez
                  </Link>
                )}
              </div>
              <div className="mt-3">
                <ReportButton
                  targetType="creator"
                  targetId={profile.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-red-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bemutatkozás */}
      {(profile.bio || profile.specialties.length > 0 || profile.websiteUrl || profile.instagramUrl) && (
        <section className="rounded-[1.5rem] border border-black/10 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Bemutatkozás
          </p>
          {profile.bio ? (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-foreground/85">
              {profile.bio}
            </p>
          ) : null}
          {profile.specialties.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="rounded-md bg-[#f0f4e5] px-2.5 py-1 text-xs font-semibold text-black hover:bg-[#e6efd4]"
                >
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
          {(profile.websiteUrl || profile.instagramUrl) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {profile.websiteUrl ? (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <Globe className="h-4 w-4 text-[#4d7c0f]" /> Weboldal
                </a>
              ) : null}
              {profile.instagramUrl ? (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <SocialTile platform="instagram" className="h-4 w-4 rounded" /> Instagram
                </a>
              ) : null}
            </div>
          )}
        </section>
      )}

      {/* 3. Portfólió — a fő szekció */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Portfólió
        </p>
        <h2 className="mt-1 text-2xl font-black">Munkáim</h2>
        {portfolio.length === 0 ? (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-black/15 bg-white p-10 text-center text-sm text-muted-foreground">
            Még nincs portfólió elem feltöltve.
          </div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {portfolio.map((item) => (
              <div key={item.id}>
                {item.title ? (
                  <p className="mb-2 font-semibold">{item.title}</p>
                ) : null}
                <PortfolioEmbed url={item.externalUrl} title={item.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Értékelések */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Visszajelzések
        </p>
        <h2 className="mt-1 text-2xl font-black">Értékelések</h2>
        {reviews.length === 0 ? (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-black/15 bg-white p-8 text-center text-sm text-muted-foreground">
            Még nincs értékelés ennél az alkotónál.
          </div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="rounded-[1.5rem] border border-black/10 bg-[#f6f7f2] p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{profile.averageRating ?? "n/a"}</span>
                <span className="text-sm text-muted-foreground">
                  / {profile.reviewCount} értékelés
                </span>
              </div>
              <div className="mt-4">
                <RatingDistribution reviews={reviews} />
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Hasonló alkotók */}
      {similar.length > 0 ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Felfedezés
          </p>
          <h2 className="mt-1 text-2xl font-black">Hasonló szakemberek</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((pro) => (
              <Link
                key={pro.username}
                href={`/creators/${pro.username}`}
                className="group flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={pro.avatarUrl ?? undefined} alt={pro.displayName} />
                  <AvatarFallback>{pro.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-bold group-hover:text-[#3f6212]">
                    {pro.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {pro.professionalRoles.map(roleLabel).join(" · ")}
                    {pro.city ? ` · ${pro.city}` : ""}
                  </p>
                  {pro.reviewCount > 0 ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      {pro.averageRating}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
