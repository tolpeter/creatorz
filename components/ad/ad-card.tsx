import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Handshake,
  Wallet,
  Users,
  Bookmark,
  Film,
  Camera,
  Images,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CREATOR_CATEGORIES,
  CONTENT_TYPES,
  COLLABORATION_TYPES,
} from "@/lib/constants";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export type AdCardData = {
  id: string;
  title: string;
  description: string | null;
  brandName: string;
  brandLogo: string | null;
  coverUrl: string | null;
  categories: string[];
  contentType: string;
  collaborationType: string;
  budgetMinHuf: number | null;
  budgetMaxHuf: number | null;
  budgetPublic: boolean;
  deadline: Date;
  applicationCount: number;
  isFeatured?: boolean;
  anonymous?: boolean;
};

// Kategória → témakép (a meglévő generált niche-képekből)
const NICHE_IMG: Record<string, string> = {
  gasztro: "/images/generated/niche-food.webp",
  utazas: "/images/generated/niche-travel.webp",
  divat: "/images/generated/niche-fashion.webp",
  beauty: "/images/generated/niche-beauty.webp",
  otthon: "/images/generated/niche-home.webp",
  anyukak: "/images/generated/niche-baby.webp",
  allatok: "/images/generated/niche-pets.webp",
  wellness: "/images/generated/niche-health.webp",
  fitness: "/images/generated/niche-health.webp",
};

export function AdCard({ ad }: { ad: AdCardData }) {
  const contentTypeLabel =
    CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label ??
    ad.contentType;
  const collabLabel =
    COLLABORATION_TYPES.find((x) => x.value === ad.collaborationType)?.label ??
    null;
  const ContentIcon =
    ad.contentType === "photo" ? Camera : ad.contentType === "both" ? Images : Film;

  // A költségkeret csak akkor látszik, ha a márka publikussá tette.
  const showBudget =
    ad.budgetPublic && (ad.budgetMinHuf != null || ad.budgetMaxHuf != null);
  const budgetText = showBudget
    ? ad.budgetMinHuf != null && ad.budgetMaxHuf != null
      ? `${formatHuf(ad.budgetMinHuf)} - ${formatHuf(ad.budgetMaxHuf)}`
      : formatHuf((ad.budgetMaxHuf ?? ad.budgetMinHuf) as number)
    : "Megegyezés szerint";

  const coverImg =
    ad.coverUrl ?? ad.categories.map((c) => NICHE_IMG[c]).find(Boolean) ?? null;

  return (
    <Link
      href={`/ads/${ad.id}`}
      className={
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl sm:flex-row sm:items-stretch sm:p-4 " +
        (ad.isFeatured
          ? "border-accent/70 shadow-[0_16px_44px_rgba(158,237,37,0.18)]"
          : "border-black/10")
      }
    >
      {/* Előkép (kategória-kép vagy gradiens + formátum-ikon) */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-[#0b0d0a] sm:aspect-auto sm:h-auto sm:w-44 lg:w-52">
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImg}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-[linear-gradient(135deg,#0b0d0a,#1c2417)]">
            <ContentIcon className="h-10 w-10 text-accent/70" />
          </div>
        )}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <ContentIcon className="h-3 w-3" />
          {contentTypeLabel}
        </span>
        {ad.isFeatured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-black shadow-sm">
            <Sparkles className="h-3 w-3" />
            Kiemelt
          </span>
        )}
      </div>

      {/* Középső tartalom */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          {ad.brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.brandLogo}
              alt=""
              className="h-7 w-7 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f0f4e5] text-xs font-bold">
              {ad.brandName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-semibold text-muted-foreground">
            {ad.brandName}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-black">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {ad.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {collabLabel && (
            <Badge className="rounded-md bg-black px-2 py-0.5 text-xs font-semibold text-accent hover:bg-black">
              {collabLabel}
            </Badge>
          )}
          {ad.categories.slice(0, 3).map((c) => (
            <Badge
              key={c}
              variant="secondary"
              className="rounded-md bg-[#f0f4e5] px-2 py-0.5 text-xs font-semibold text-black hover:bg-[#e6efd4]"
            >
              {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
            </Badge>
          ))}
        </div>
      </div>

      {/* Jobb oldali sáv: költségkeret + határidő + ajánlatok + CTA */}
      <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-black/10 pt-3 sm:w-52 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={`text-lg font-black leading-none ${
                  showBudget ? "text-[#4d7c0f]" : "text-foreground"
                }`}
              >
                {budgetText}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                {showBudget ? (
                  <Wallet className="h-3 w-3" />
                ) : (
                  <Handshake className="h-3 w-3" />
                )}
                Költségkeret
              </p>
            </div>
            <span className="text-muted-foreground transition-colors group-hover:text-accent">
              <Bookmark className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Határidő:{" "}
              <span className="font-semibold text-foreground">
                {formatHuDate(ad.deadline)}
              </span>
            </p>
            {/* A pályázók száma SZÁNDÉKOSAN nem nyilvános — verseny-bizalom. */}
          </div>
        </div>

        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-black">
          Részletek megtekintése
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
