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
      {/* Hero kép */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
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
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {c.hasVideo && (
            <Badge className="rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground shadow">
              <PlayCircle className="mr-1 h-3 w-3" /> Pitch videó
            </Badge>
          )}
          {c.isFeatured && (
            <Badge className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground shadow">
              ★ Kiemelt
            </Badge>
          )}
        </div>

        {/* Alsó gomb */}
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2">
          <span className="flex-1 rounded-full bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground shadow-lg">
            Profil megtekintése
          </span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg"
            aria-hidden
          >
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Adatok */}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold">{c.displayName}</h3>
          {c.city && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {c.city}
            </span>
          )}
        </div>

        {c.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] font-medium">
                {CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat}
              </Badge>
            ))}
            {c.categories.length > 2 && (
              <Badge variant="secondary" className="text-[10px] font-medium">
                +{c.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="font-semibold">{c.averageRating ?? "—"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatNumber(totalFollowers || c.reviewCount)}
            </span>{" "}
            {totalFollowers > 0 ? "követő" : "értékelés"}
          </div>
        </div>
      </div>
    </Link>
  );
}
