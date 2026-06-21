"use client";

import { BadgeCheck, Link2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialTile } from "@/components/creator/platform-icon";
import { formatNumber } from "@/lib/utils/format";

/**
 * Megosztott social-sorok — a profil-szerkesztő és az onboarding wizard
 * is ezeket használja, hogy egységes legyen a UX:
 *   - SocialAutoRow: TikTok / YouTube — összekapcsolható (auto behúzás)
 *   - SocialManualRow: Instagram / Facebook — kézi (kötelező) követőszám
 */

/** Automata sor: nagy logó-csempe + URL + behúzott szám + „Összekapcsol". */
export function SocialAutoRow({
  platform,
  label,
  unit,
  url,
  count,
  onUrl,
  onCount,
  onConnect,
  connecting,
  officialHref,
  official,
  countReadOnly,
}: {
  platform: "tiktok" | "youtube";
  label: string;
  unit: string;
  url: string;
  count: string;
  onUrl: (v: string) => void;
  onCount: (v: string) => void;
  onConnect: () => void;
  connecting: boolean;
  /** Ha meg van adva (csak TikTok), megjelenik a hivatalos OAuth gomb. */
  officialHref?: string;
  /** Igaz, ha a hivatalos TikTok-fiók már össze van kötve. */
  official?: boolean;
  /** A követőszám-mező nem írható kézzel — az Összekapcsol tölti ki. */
  countReadOnly?: boolean;
}) {
  const hasCount = Number(count) > 0;
  const needsCount = !countReadOnly && url.trim().length > 0 && !hasCount;
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-3">
      <div className="grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)] lg:grid-cols-[56px_minmax(0,1fr)_160px_auto] lg:items-end">
        <SocialTile platform={platform} className="h-14 w-14" />
        <div className="min-w-0">
          <Label className="text-sm">{label} profil URL</Label>
          <Input
            value={url}
            onChange={(e) => onUrl(e.target.value)}
            placeholder="@felhasználónév vagy URL"
            className="mt-1.5"
          />
        </div>
        <div className="min-w-0">
          <Label className="text-sm">{unit}szám{countReadOnly ? "" : " *"}</Label>
          <NumberInput
            value={count}
            onChange={onCount}
            disabled={countReadOnly}
            readOnly={countReadOnly}
            placeholder={countReadOnly ? "Összekapcsolásból" : "pl. 24 500"}
            aria-invalid={needsCount}
            className={`mt-1.5 ${
              countReadOnly
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : needsCount
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
            }`}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onConnect}
          disabled={connecting}
          className="shrink-0"
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Összekapcsol
        </Button>
      </div>
      {hasCount ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#3f6212]">
          <BadgeCheck className="h-3.5 w-3.5 text-accent" />
          {formatNumber(Number(count))} {unit}
        </p>
      ) : countReadOnly && url.trim().length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Kattints az „Összekapcsol"-ra — a {unit}számot a rendszer tölti ki a valós adattal.
        </p>
      ) : null}
      {needsCount ? (
        <p className="mt-2 text-xs text-destructive">
          A szám megadása kötelező, ha megadtad a {label} linket.
        </p>
      ) : null}

      {officialHref ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-3">
          {official ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f6212]">
              <BadgeCheck className="h-4 w-4 text-accent" />
              Hivatalosan összekötve — pontos statok a TikToktól
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Hitelesítsd a pontos statokat (követő, like, videó) a TikTok hivatalos összekötésével:
            </span>
          )}
          <Button asChild size="sm" className="bg-black text-white hover:bg-black/85">
            <a href={officialHref}>
              <SocialTile platform="tiktok" className="h-4 w-4 rounded" />
              {official ? "Újraszinkronizálás" : "Hivatalos TikTok összekötés"}
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Kézi sor: nagy logó-csempe + URL + kötelező követőszám mező (IG/FB). */
export function SocialManualRow({
  platform,
  label,
  unit,
  url,
  count,
  onUrl,
  onCount,
}: {
  platform: "instagram" | "facebook";
  label: string;
  unit: string;
  url: string;
  count: string;
  onUrl: (v: string) => void;
  onCount: (v: string) => void;
}) {
  const needsCount = url.trim().length > 0 && !(Number(count) > 0);
  const article = /^[aáeéiíoóöőuúüű]/i.test(label) ? "Az" : "A";
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SocialTile platform={platform} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <Label className="text-sm">{label} profil URL</Label>
          <Input
            value={url}
            onChange={(e) => onUrl(e.target.value)}
            placeholder="@felhasználónév vagy URL"
            className="mt-1.5"
          />
        </div>
        <NumberInput
          value={count}
          onChange={onCount}
          placeholder={`${unit}szám *`}
          aria-invalid={needsCount}
          className={`sm:w-[150px] ${needsCount ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
      </div>
      {needsCount && (
        <p className="mt-2 text-xs text-destructive">
          {article} {label} követőszám megadása kötelező, ha megadtad a linket.
        </p>
      )}
    </div>
  );
}
