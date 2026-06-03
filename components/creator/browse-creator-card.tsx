import Link from "next/link";
import { Star, MapPin, PlayCircle, Bookmark, Camera, ArrowRight } from "lucide-react";
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
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md",
        c.isFeatured && "ring-2 ring-accent/70"
      )}
    >
      {/* HERO KÉP — kisebb arány */}
      <Link
        href={`/creators/${c.username}`}
        className="relative block aspect-[3/4] overflow-hidden bg-muted"
      >
        {c.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.avatarUrl}
            alt={c.displayName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20 text-4xl font-bold text-muted-foreground/40">
            {c.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Felső badge-ek — kisebb */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {c.hasVideo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              <PlayCircle className="h-2.5 w-2.5" />
              Pitch
            </span>
          )}
          {c.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
              ★ Kiemelt
            </span>
          )}
        </div>

        {/* Play-kör jobb alul */}
        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur transition-transform group-hover:scale-110">
          <PlayCircle className="h-4 w-4" />
        </span>
      </Link>

      {/* INFÓ — tömör */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={c.avatarUrl ?? undefined} alt={c.displayName} />
            <AvatarFallback className="text-xs">
              {c.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              href={`/creators/${c.username}`}
              className="block truncate text-sm font-semibold hover:underline"
            >
              {c.displayName}
            </Link>
            {c.city && (
              <p className="flex items-center gap-0.5 truncate text-[11px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" /> {c.city}
              </p>
            )}
          </div>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            aria-label="Mentés"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>

        {c.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {c.categories.slice(0, 2).map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-[10px] font-medium"
              >
                {CREATOR_CATEGORIES.find((x) => x.value === cat)?.label ?? cat}
              </Badge>
            ))}
            {c.categories.length > 2 && (
              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
                +{c.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-semibold">{c.averageRating ?? "—"}</span>
          </span>
          {totalFollowers > 0 ? (
            <span className="flex items-center gap-1">
              <span className="font-semibold">{formatNumber(totalFollowers)}</span>
              <Camera className="h-3 w-3 text-muted-foreground" />
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">{c.reviewCount} ★</span>
          )}
        </div>

        <Link
          href={`/creators/${c.username}`}
          className="mt-auto flex items-center justify-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
        >
          Profil
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
