import Link from "next/link";
import {
  Star,
  MapPin,
  PlayCircle,
  Bookmark,
  Camera,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format";

export type BrowseCard = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  county: string | null;
  categories: string[];
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  isFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
  hasVideo: boolean;
};

export function BrowseCreatorCard({ c }: { c: BrowseCard }) {
  const totalFollowers = (c.instagramFollowers ?? 0) + (c.tiktokFollowers ?? 0);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg",
        c.isFeatured && "ring-2 ring-accent/70"
      )}
    >
      {/* HERO KÉP */}
      <Link href={`/creators/${c.username}`} className="relative block aspect-[4/5] overflow-hidden bg-muted">
        {c.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.avatarUrl}
            alt={c.displayName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20 text-6xl font-bold text-muted-foreground/40">
            {c.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Felső badge-ek */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {c.hasVideo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <PlayCircle className="h-3.5 w-3.5" />
              Pitch videó
            </span>
          )}
          {c.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              ★ Kiemelt
            </span>
          )}
        </div>

        {/* Sarokban play-kör */}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur transition-transform group-hover:scale-110">
          <PlayCircle className="h-5 w-5" />
        </span>
      </Link>

      {/* INFÓ */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Avatar + név + bookmark */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={c.avatarUrl ?? undefined} alt={c.displayName} />
            <AvatarFallback>{c.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              href={`/creators/${c.username}`}
              className="block truncate text-base font-semibold hover:underline"
            >
              {c.displayName}
            </Link>
            {c.city && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {c.city}
              </p>
            )}
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            aria-label="Mentés"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        {/* Kategória chipek */}
        {c.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {c.categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="rounded-md text-[11px] font-medium">
                {CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat}
              </Badge>
            ))}
            {c.categories.length > 2 && (
              <Badge variant="secondary" className="rounded-md text-[11px] font-medium">
                +{c.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Stats sor */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold">{c.averageRating ?? "—"}</span>
          </span>
          {totalFollowers > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">{formatNumber(totalFollowers)}</span>
              <span className="text-xs text-muted-foreground">követő</span>
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{c.reviewCount} értékelés</span>
          )}
        </div>

        {/* CTA gomb */}
        <Link
          href={`/creators/${c.username}`}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent hover:shadow-md"
        >
          <span className="text-foreground">Profil megtekintése</span>
          <ArrowRight className="h-4 w-4 text-foreground" />
        </Link>
      </div>
    </div>
  );
}
