import Link from "next/link";
import { Star, MapPin, Eye, PlayCircle } from "lucide-react";
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
  const loc = [c.city, c.county].filter((x) => x && x !== c.city).join(", ");

  return (
    <Link
      href={`/creators/${c.username}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg",
        c.isFeatured && "ring-2 ring-accent"
      )}
    >
      {/* Nagy hero kép */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {c.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.avatarUrl}
            alt={c.displayName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20 text-5xl font-bold text-muted-foreground">
            {c.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Felül lebegő badge-ek */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {c.hasVideo && (
            <Badge className="rounded-full bg-primary text-primary-foreground shadow">
              <PlayCircle className="mr-1 h-3.5 w-3.5" /> Pitch videó
            </Badge>
          )}
          {c.isFeatured && (
            <Badge className="rounded-full bg-accent text-accent-foreground shadow">
              ★ Kiemelt
            </Badge>
          )}
        </div>

        {/* Alsó gombok */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg pointer-events-none"
          >
            Megnézem a profilt
          </button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg"
            title="Portfólió megtekintése"
          >
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Adatok */}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{c.displayName}</h3>
          {(c.city || loc) && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {c.city}
              {loc && <>, {loc}</>}
            </span>
          )}
        </div>

        {c.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold">{c.averageRating ?? "—"}</span>
            <span className="text-xs text-muted-foreground">Értékelés</span>
          </div>
          <div className="text-right">
            <span className="font-semibold">{formatNumber(totalFollowers || c.reviewCount)}</span>
            <span className="ml-1 text-xs text-muted-foreground">
              {totalFollowers > 0 ? "követő" : "értékelés"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
