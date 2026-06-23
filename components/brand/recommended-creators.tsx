"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BadgeCheck, Check, ExternalLink, Sparkles, Star, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteCreatorToAd } from "@/app/actions/invitations";
import { formatNumber } from "@/lib/utils/format";

export type RecommendedCreatorView = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  verified: boolean;
  isFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
  matchScore: number;
};

export function RecommendedCreators({
  adId,
  creators,
}: {
  adId: string;
  creators: RecommendedCreatorView[];
}) {
  if (creators.length === 0) return null;
  return (
    <Card className="border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-[#4d7c0f]">
            <Sparkles className="h-4 w-4" />
          </span>
          AI-ajánlott tartalomgyártók
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          A kampányod tartalma alapján a legjobban illeszkedő creatorok. Hívd meg
          őket, hogy pályázzanak.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {creators.map((c) => (
          <CreatorRow key={c.id} adId={adId} creator={c} />
        ))}
      </CardContent>
    </Card>
  );
}

function CreatorRow({ adId, creator: c }: { adId: string; creator: RecommendedCreatorView }) {
  const [pending, startTransition] = useTransition();
  const [invited, setInvited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followers = c.tiktokFollowers ?? c.instagramFollowers;

  function onInvite() {
    setError(null);
    startTransition(async () => {
      const res = await inviteCreatorToAd({ adId, creatorId: c.id, message: "" });
      if (res?.error) setError(res.error);
      else setInvited(true);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={c.avatarUrl ?? undefined} alt={c.displayName} />
          <AvatarFallback>{c.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold">
            {c.displayName}
            {c.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {c.city ?? "Magyar tartalomgyártó"}
            {c.averageRating ? (
              <span className="ml-1 inline-flex items-center gap-0.5">
                · <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {c.averageRating} ({c.reviewCount})
              </span>
            ) : null}
          </p>
        </div>
        <Badge className="shrink-0 rounded-full bg-accent/15 text-[#3f6212] hover:bg-accent/15">
          {c.matchScore}% egyezés
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {followers ? `${formatNumber(followers)} követő` : "—"}
        </span>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/creators/${c.username}`} target="_blank">
              Profil <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {invited ? (
            <Button size="sm" disabled variant="secondary">
              <Check className="h-4 w-4" /> Meghívva
            </Button>
          ) : (
            <Button size="sm" onClick={onInvite} disabled={pending}>
              <UserPlus className="h-4 w-4" /> {pending ? "…" : "Meghívás"}
            </Button>
          )}
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
