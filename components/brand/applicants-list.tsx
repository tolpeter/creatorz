"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, Heart, Megaphone, Inbox, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { ApplicationStatusBadge } from "@/components/shared/ad-status-badge";
import { ApplicationActions } from "@/components/brand/application-actions";
import { SocialTile } from "@/components/creator/platform-icon";
import { formatNumber, formatHuDate } from "@/lib/utils/format";
import {
  GENDER_OPTIONS,
  CREATOR_TYPES,
  CREATOR_TYPE_LABELS,
  CREATOR_CATEGORIES,
} from "@/lib/constants";

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
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  county?: string | null;
  creatorType?: string | null;
  categories?: string[] | null;
  // Csak a kampányokon átívelő (Jelentkezők) listához — melyik kampányra.
  adId?: string;
  adTitle?: string | null;
};

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const GENDER_LABEL: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.value, g.label]),
);

export function ApplicantsList({
  apps,
  collapsible = false,
  readOnly = false,
  showHeading = true,
}: {
  apps: Applicant[];
  collapsible?: boolean;
  /** Admin nézet: nincs elfogadás/elutasítás gomb (csak megtekintés + szűrés). */
  readOnly?: boolean;
  /** A "Beérkezett pályázatok (N)" cím megjelenítése (nem-collapsible módban). */
  showHeading?: boolean;
}) {
  // A szűrő alapból NYITVA van — egyből látható és használható.
  const [open, setOpen] = useState(true);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minTt, setMinTt] = useState("");
  const [minTtLikes, setMinTtLikes] = useState("");
  const [minIg, setMinIg] = useState("");
  const [minFb, setMinFb] = useState("");

  const filtered = useMemo(() => {
    const minA = num(minAge);
    const maxA = num(maxAge);
    const tt = num(minTt);
    const ttL = num(minTtLikes);
    const ig = num(minIg);
    const fb = num(minFb);
    const cityQ = city.trim().toLowerCase();
    return apps.filter((a) => {
      if (minA && (a.age ?? 0) < minA) return false;
      if (maxA && (a.age ?? 999) > maxA) return false;
      if (gender && a.gender !== gender) return false;
      if (creatorType && (a.creatorType ?? "ugc") !== creatorType) return false;
      if (category && !(a.categories ?? []).includes(category)) return false;
      if (cityQ && !(a.city ?? "").toLowerCase().includes(cityQ)) return false;
      if ((a.tiktokFollowers ?? 0) < tt) return false;
      if ((a.tiktokLikes ?? 0) < ttL) return false;
      if ((a.instagramFollowers ?? 0) < ig) return false;
      if ((a.facebookFollowers ?? 0) < fb) return false;
      return true;
    });
  }, [apps, minAge, maxAge, gender, creatorType, category, city, minTt, minTtLikes, minIg, minFb]);

  const activeFilters = [
    num(minAge) > 0,
    num(maxAge) > 0,
    !!gender,
    !!creatorType,
    !!category,
    !!city.trim(),
    num(minTt) > 0,
    num(minTtLikes) > 0,
    num(minIg) > 0,
    num(minFb) > 0,
  ].filter(Boolean).length;

  function reset() {
    setMinAge("");
    setMaxAge("");
    setGender("");
    setCreatorType("");
    setCategory("");
    setCity("");
    setMinTt("");
    setMinTtLikes("");
    setMinIg("");
    setMinFb("");
  }

  const inner = (
    <>
      {/* Feltűnő szűrő-panel — alapból nyitva */}
      <Card className="mb-4 overflow-hidden border-accent/40 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b bg-[#f0f4e5] px-4 py-2.5">
          <div className="flex items-center gap-2 font-semibold text-[#3f6212]">
            <SlidersHorizontal className="h-4 w-4" />
            Jelentkezők szűrése
            {activeFilters > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-black">
                {activeFilters}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-[#3f6212]" onClick={reset}>
                <X className="h-3.5 w-3.5" /> Törlés
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setOpen((v) => !v)}>
              {open ? "Elrejt" : "Mutat"}
            </Button>
          </div>
        </div>

        {open && (
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Kor */}
            <div className="space-y-1.5">
              <Label className="text-xs">Kor (min–max)</Label>
              <div className="flex items-center gap-2">
                <NumberInput value={minAge} onChange={setMinAge} placeholder="18" className="h-9" />
                <span className="text-muted-foreground">–</span>
                <NumberInput value={maxAge} onChange={setMaxAge} placeholder="65" className="h-9" />
              </div>
            </div>
            {/* Nem */}
            <SelectField label="Nem" value={gender} onChange={setGender} placeholder="Mindegy">
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </SelectField>
            {/* Típus */}
            <SelectField label="Típus" value={creatorType} onChange={setCreatorType} placeholder="Mindegy">
              {CREATOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </SelectField>
            {/* Kategória */}
            <SelectField label="Kategória" value={category} onChange={setCategory} placeholder="Mindegy">
              {CREATOR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </SelectField>
            {/* Város */}
            <div className="space-y-1.5">
              <Label className="text-xs">Város</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="pl. Budapest" className="h-9" />
            </div>
            <Field label="Min. TikTok követő" value={minTt} onChange={setMinTt} />
            <Field label="Min. TikTok like" value={minTtLikes} onChange={setMinTtLikes} />
            <Field label="Min. Instagram követő" value={minIg} onChange={setMinIg} />
            <Field label="Min. Facebook követő" value={minFb} onChange={setMinFb} />
          </CardContent>
        )}
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">
        {filtered.length}
        {filtered.length !== apps.length ? ` / ${apps.length}` : ""} megjelenítve
      </p>

      {apps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Még nincs pályázat erre a kampányra.
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

                {/* Demográfia: kor · nem · város · típus */}
                {(a.age || a.gender || a.city || a.creatorType) && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-foreground/70">
                    {a.age ? <span>{a.age} éves</span> : null}
                    {a.gender ? <span>· {GENDER_LABEL[a.gender] ?? a.gender}</span> : null}
                    {a.city ? <span>· {a.city}</span> : null}
                    {a.creatorType ? (
                      <span>· {CREATOR_TYPE_LABELS[a.creatorType] ?? a.creatorType}</span>
                    ) : null}
                  </div>
                )}

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
                {!readOnly && a.status === "pending" && (
                  <ApplicationActions applicationId={a.id} />
                )}
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
        {showHeading && (
          <h2 className="mb-3 text-xl font-bold">Beérkezett pályázatok ({apps.length})</h2>
        )}
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

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  );
}
