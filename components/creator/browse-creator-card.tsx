import Link from "next/link";
import {
  Star,
  MapPin,
  PlayCircle,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Eye,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, PROFESSIONAL_ROLES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format";
import { FavoriteButton } from "@/components/creator/favorite-button";
import { Logo } from "@/components/layout/logo";
import { SocialTile } from "@/components/creator/platform-icon";

export type BrowseCard = {
  id: string;
  saved: boolean;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  county: string | null;
  categories: string[];
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  isFeatured: boolean;
  verified: boolean;
  averageRating: string | null;
  reviewCount: number;
  hasVideo: boolean;
  activity?: string | null;
  // Típus-érzékeny kártya: UGC vagy kreatív szakember
  profileKind?: "ugc" | "professional";
  professionalRoles?: string[];
  specialties?: string[];
};

export function BrowseCreatorCard({ c, canSave }: { c: BrowseCard; canSave: boolean }) {
  const isProfessional = c.profileKind === "professional";
  const tiktokFollowers = c.tiktokFollowers ?? 0;
  const roleLabels = (c.professionalRoles ?? []).map(
    (r) => PROFESSIONAL_ROLES.find((x) => x.value === r)?.label ?? r,
  );
  const categoryLabels = isProfessional
    ? roleLabels.slice(0, 2)
    : c.categories
        .slice(0, 2)
        .map((cat) => CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat);

  return (
    <>
    <Link
      href={`/creators/${c.username}`}
      className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white p-3 shadow-sm transition-colors hover:border-accent sm:hidden"
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#e9ecdf] ring-1 ring-black/10">
        {c.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.avatarUrl}
            alt={c.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#f3f3ee]">
            <Logo variant="dark" className="text-[11px]" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1 text-base font-semibold leading-tight">
          <span className="truncate">{c.displayName}</span>
          {c.verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
        </span>
        {isProfessional ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="whitespace-nowrap">
              {c.averageRating ?? "—"} · {c.reviewCount} ért.
            </span>
          </span>
        ) : (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <SocialTile platform="tiktok" className="h-4 w-4 rounded-full" />
            <span className="whitespace-nowrap">{formatNumber(tiktokFollowers)} követő</span>
          </span>
        )}
        {categoryLabels.length > 0 ? (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {categoryLabels.map((label) => (
              <span
                key={label}
                className={
                  isProfessional
                    ? "rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-black"
                    : "rounded-full bg-[#f0f2e8] px-2 py-0.5 text-[11px] font-medium text-black"
                }
              >
                {label}
              </span>
            ))}
            {(isProfessional ? roleLabels.length : c.categories.length) >
            categoryLabels.length ? (
              <span className="rounded-full bg-[#f0f2e8] px-2 py-0.5 text-[11px] font-medium text-black">
                +{(isProfessional ? roleLabels.length : c.categories.length) -
                  categoryLabels.length}
              </span>
            ) : null}
          </span>
        ) : null}
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {[c.city, c.activity].filter(Boolean).join(" · ")}
        </span>
      </span>

      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf5ff] text-[#005fca]"
        aria-hidden
      >
        <Eye className="h-5 w-5" />
      </span>
    </Link>

    <div
      className={cn(
        "group relative hidden h-full min-h-[32.75rem] flex-col overflow-hidden rounded-[1.35rem] border border-black/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_18px_48px_rgba(0,0,0,0.12)] sm:flex",
        c.isFeatured &&
          "border-accent shadow-[0_18px_50px_rgba(158,237,37,0.2)]",
      )}
    >
      <div className="relative aspect-[1.16/1] overflow-hidden bg-[#e9ecdf]">
        <Link
          href={`/creators/${c.username}`}
          className="absolute inset-0 block"
        >
          {c.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.avatarUrl}
              alt={c.displayName}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_45%_35%,#ffffff,transparent_34%),linear-gradient(135deg,#f7f4ee,#d9d9d1)] p-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-[1.25rem] bg-white/90 shadow-[0_18px_55px_rgba(0,0,0,0.14)] ring-1 ring-black/5 sm:h-28 sm:w-28">
                <Logo variant="dark" className="text-xl sm:text-2xl" />
              </div>
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          {c.hasVideo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
              <PlayCircle className="h-3 w-3" />
              Pitch
            </span>
          )}
          {c.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-black shadow-sm">
              <Sparkles className="h-3 w-3" />
              Kiemelt
            </span>
          )}
          {c.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#3f6212] shadow-sm backdrop-blur">
              <BadgeCheck className="h-3 w-3 text-accent" />
              Hitelesített
            </span>
          )}
        </div>

        <FavoriteButton creatorId={c.id} initialSaved={c.saved} canSave={canSave} />

        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg backdrop-blur transition-transform group-hover:scale-110">
          <PlayCircle className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/creators/${c.username}`}
            className="flex items-center gap-1 truncate text-[1.55rem] font-semibold leading-tight tracking-normal hover:underline"
          >
            <span className="truncate">{c.displayName}</span>
            {c.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
            )}
          </Link>
          {c.city && (
            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {c.city}
            </p>
          )}
          {c.activity && (
            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[#4d7c0f]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#66d01c]" />
              {c.activity}
            </p>
          )}
        </div>

        {isProfessional ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {roleLabels.map((label) => (
              <Badge
                key={label}
                className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-black hover:bg-accent"
              >
                {label}
              </Badge>
            ))}
            {(c.specialties ?? []).slice(0, 2).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="rounded-full bg-[#f0f2e8] px-3 py-1 text-xs font-semibold text-black hover:bg-[#e6efd4]"
              >
                {s}
              </Badge>
            ))}
          </div>
        ) : c.categories.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {c.categories.slice(0, 2).map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="rounded-full bg-[#f0f2e8] px-3 py-1 text-xs font-semibold text-black hover:bg-[#e6efd4]"
              >
                {CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat}
              </Badge>
            ))}
            {c.categories.length > 2 && (
              <Badge
                variant="secondary"
                className="rounded-full bg-[#f0f2e8] px-3 py-1 text-xs font-semibold text-black hover:bg-[#e6efd4]"
              >
                +{c.categories.length - 2}
              </Badge>
            )}
          </div>
        ) : null}

        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center border-t border-black/10 pt-4">
          <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 pr-3">
            <Star className="row-span-2 h-6 w-6 fill-accent text-accent" />
            <p className="min-w-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">
              Értékelés
            </p>
            <p className="whitespace-nowrap text-lg font-medium leading-tight">
              {c.averageRating ?? "—"}
            </p>
          </div>
          <div className="h-10 w-px bg-black/10" aria-hidden />
          {isProfessional ? (
            <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 pl-3">
              <Camera className="row-span-2 h-6 w-6 text-[#4d7c0f]" />
              <p className="min-w-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">
                Értékelések
              </p>
              <p className="whitespace-nowrap text-lg font-medium leading-tight">
                {c.reviewCount}
              </p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 pl-3">
              <SocialTile platform="tiktok" className="row-span-2 h-6 w-6 rounded-full" />
              <p className="min-w-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">
                Követők
              </p>
              <p className="whitespace-nowrap text-lg font-medium leading-tight">
                {formatNumber(tiktokFollowers)}
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/creators/${c.username}`}
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-3 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:bg-accent hover:text-black"
        >
          Profil megnyitása
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
    </>
  );
}
