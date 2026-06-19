"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, Heart, Megaphone, Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { ApplicationStatusBadge } from "@/components/shared/ad-status-badge";
import { ApplicationActions } from "@/components/brand/application-actions";
import { SocialTile } from "@/components/creator/platform-icon";
import { formatNumber, formatHuDate } from "@/lib/utils/format";

export type Applicant = {
  id: string;
  message: string;
  status: string;
  createdAt: string | Date;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  tiktokFollowers: number | null;
  tiktokLikes: number | null;
  instagramFollowers: number | null;
  facebookFollowers: number | null;
  // Csak a kampányokon átívelő (Jelentkezők) listához — melyik hirdetésre.
  adId?: string;
  adTitle?: string | null;
};

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function ApplicantsList({
  apps,
  collapsible = false,
}: {
  apps: Applicant[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [minTt, setMinTt] = useState("");
  const [minTtLikes, setMinTtLikes] = useState("");
  const [minIg, setMinIg] = useState("");
  const [minFb, setMinFb] = useState("");

  const filtered = useMemo(() => {
    const tt = num(minTt);
    const ttL = num(minTtLikes);
    const ig = num(minIg);
    const fb = num(minFb);
    return apps.filter(
      (a) =>
        (a.tiktokFollowers ?? 0) >= tt &&
        (a.tiktokLikes ?? 0) >= ttL &&
        (a.instagramFollowers ?? 0) >= ig &&
        (a.facebookFollowers ?? 0) >= fb,
    );
  }, [apps, minTt, minTtLikes, minIg, minFb]);

  const activeFilters = [minTt, minTtLikes, minIg, minFb].filter((v) => num(v) > 0).length;

  const inner = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length}
          {filtered.length !== apps.length ? ` / ${apps.length}` : ""} megjelenítve
        </p>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" />
          Szűrés{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </Button>
      </div>

      {open && (
        <Card className="mb-4">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Min. TikTok követő" value={minTt} onChange={setMinTt} />
            <Field label="Min. TikTok like" value={minTtLikes} onChange={setMinTtLikes} />
            <Field label="Min. Instagram követő" value={minIg} onChange={setMinIg} />
            <Field label="Min. Facebook követő" value={minFb} onChange={setMinFb} />
            {activeFilters > 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMinTt("");
                    setMinTtLikes("");
                    setMinIg("");
                    setMinFb("");
                  }}
                >
                  Szűrők törlése
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {apps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Még nincs pályázat erre a hirdetésre.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Nincs a szűrőnek megfelelő jelentkező.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/creators/${a.username}`}
                    target="_blank"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={a.avatarUrl ?? undefined} />
                      <AvatarFallback>{a.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{a.displayName}</p>
                      <p className="text-xs text-muted-foreground">{formatHuDate(a.createdAt)}</p>
                    </div>
                  </Link>
                  <ApplicationStatusBadge status={a.status} />
                </div>

                {a.adTitle && a.adId ? (
                  <Link
                    href={`/brand/ads/${a.adId}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#3f6212] hover:bg-[#e6efd4]"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    {a.adTitle}
                  </Link>
                ) : null}

                {/* Social statisztika */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {a.tiktokFollowers != null && (
                    <span className="inline-flex items-center gap-1">
                      <SocialTile platform="tiktok" className="h-3.5 w-3.5 rounded" />
                      {formatNumber(a.tiktokFollowers)} követő
                    </span>
                  )}
                  {a.tiktokLikes != null && (
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {formatNumber(a.tiktokLikes)} like
                    </span>
                  )}
                  {a.instagramFollowers != null && (
                    <span className="inline-flex items-center gap-1">
                      <SocialTile platform="instagram" className="h-3.5 w-3.5 rounded" />
                      {formatNumber(a.instagramFollowers)}
                    </span>
                  )}
                  {a.facebookFollowers != null && (
                    <span className="inline-flex items-center gap-1">
                      <SocialTile platform="facebook" className="h-3.5 w-3.5 rounded" />
                      {formatNumber(a.facebookFollowers)}
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-sm">{a.message}</p>
                {a.status === "pending" && <ApplicationActions applicationId={a.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  if (!collapsible) {
    return (
      <div>
        <h2 className="mb-3 text-xl font-bold">Beérkezett pályázatok ({apps.length})</h2>
        {inner}
      </div>
    );
  }

  return (
    <CollapsibleSection
      title="Beérkezett pályázatok"
      count={apps.length}
      icon={<Inbox className="h-4 w-4" />}
      defaultOpen={apps.length > 0 && apps.length <= 4}
    >
      {inner}
    </CollapsibleSection>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <NumberInput value={value} onChange={onChange} placeholder="0" className="h-9" />
    </div>
  );
}
