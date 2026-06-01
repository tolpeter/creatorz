import Link from "next/link";
import { Star, MapPin, Camera, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format";

export type CreatorCardData = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  categories: string[];
  instagramFollowers: number | null;
  instagramVerified: boolean;
  tiktokFollowers: number | null;
  tiktokVerified: boolean;
  isFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
};

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  return (
    <Link
      href={`/creators/${creator.username}`}
      className={cn(
        "group block rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        creator.isFeatured && "ring-2 ring-accent lime-glow"
      )}
    >
      <div className="flex items-start justify-between">
        <Avatar className="h-16 w-16">
          <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
          <AvatarFallback>{creator.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {creator.averageRating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium">{creator.averageRating}</span>
            <span className="text-muted-foreground">({creator.reviewCount})</span>
          </div>
        )}
      </div>

      {creator.isFeatured && (
        <Badge className="mt-2 bg-accent text-accent-foreground hover:bg-accent">
          ★ Kiemelt
        </Badge>
      )}

      <h3 className="mt-3 text-lg font-semibold">{creator.displayName}</h3>
      {creator.city && (
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {creator.city}
        </p>
      )}

      {creator.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {creator.categories.map((c) => (
            <Badge key={c} variant="secondary" className="text-xs">
              {CREATOR_CATEGORIES.find((cat) => cat.value === c)?.label ?? c}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1 text-sm">
        {creator.instagramFollowers != null && (
          <div className="flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formatNumber(creator.instagramFollowers)}</span>
            <span className="text-muted-foreground">követő</span>
            {creator.instagramVerified && <span className="text-accent">✓</span>}
          </div>
        )}
        {creator.tiktokFollowers != null && (
          <div className="flex items-center gap-1.5">
            <Music2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formatNumber(creator.tiktokFollowers)}</span>
            <span className="text-muted-foreground">követő</span>
            {creator.tiktokVerified && <span className="text-accent">✓</span>}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm font-semibold text-accent group-hover:underline">
        Profil megtekintése →
      </div>
    </Link>
  );
}
