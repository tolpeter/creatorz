"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Link2,
  BadgeCheck,
  Save,
  Sparkles,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { SocialTile } from "@/components/creator/platform-icon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { ImageUploader } from "@/components/creator/image-uploader";
import { IntroVideoUploader } from "@/components/creator/intro-video-uploader";
import {
  CREATOR_CATEGORIES,
  HUNGARIAN_COUNTIES,
  LANGUAGES,
  GENDER_OPTIONS,
  BIO_MAX_LENGTH,
  MAX_CREATOR_CATEGORIES,
} from "@/lib/constants";
import { generateUsername } from "@/lib/utils/slug";
import { formatNumber } from "@/lib/utils/format";
import {
  updateCreatorBasics,
  updateCreatorAppearance,
  updateCreatorIntroVideo,
  updateCreatorSocial,
  connectCreatorSocials,
  verifyCreatorProfile,
  disconnectTikTok,
} from "@/app/actions/creator-profile";

export type ProfileEditorInitial = {
  username: string;
  displayName: string;
  bio: string;
  city: string;
  county: string;
  birthDate: string;
  gender: string;
  categories: string[];
  languages: string[];
  avatarUrl: string | null;
  introVideoUrl: string | null;
  instagramUrl: string;
  instagramFollowers: string;
  tiktokUrl: string;
  tiktokFollowers: string;
  facebookUrl: string;
  facebookFollowers: string;
  youtubeUrl: string;
  youtubeSubscribers: string;
  tiktokOfficial?: boolean;
};

type ActionResult = { success?: boolean; error?: string };

export function ProfileEditor({
  initial,
  verified = false,
}: {
  initial: ProfileEditorInitial;
  verified?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<ProfileEditorInitial>(initial);
  const [isVerified, setIsVerified] = useState(verified);
  const [verifying, setVerifying] = useState(false);

  // Hitelesítés feltételei (élő, a mezők alapján)
  const verifyChecks = [
    { ok: Boolean(v.avatarUrl), label: "Profilkép feltöltve" },
    { ok: v.bio.trim().length >= 10, label: "Bemutatkozás (min. 10 karakter)" },
    { ok: v.categories.length >= 1, label: "Legalább 1 kategória" },
    {
      ok: Boolean(v.instagramUrl || v.tiktokUrl || v.facebookUrl || v.youtubeUrl),
      label: "Legalább 1 közösségi fiók",
    },
  ];
  const canVerify = verifyChecks.every((c) => c.ok);

  async function runVerify() {
    setVerifying(true);
    const res = await verifyCreatorProfile();
    setVerifying(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setIsVerified(true);
    toast.success("Profilod hitelesítve! 🎉");
    router.refresh();
  }

  // Profil kitöltöttség (élő, a mezők alapján)
  const score = useMemo(() => {
    const checks = [
      Boolean(v.displayName && v.username),
      v.categories.length > 0,
      v.languages.length > 0,
      Boolean(v.avatarUrl),
      Boolean(v.bio),
      Boolean(v.city || v.county),
      Boolean(v.tiktokUrl || v.instagramUrl || v.youtubeUrl || v.facebookUrl),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [v]);
  const [saving, setSaving] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<"tiktok" | "youtube" | null>(null);
  const [disconnectingTt, setDisconnectingTt] = useState(false);

  async function disconnectTt() {
    setDisconnectingTt(true);
    const res = await disconnectTikTok();
    setDisconnectingTt(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setV((prev) => ({ ...prev, tiktokOfficial: false }));
    toast.success("TikTok szétkapcsolva");
    router.refresh();
  }

  function set<K extends keyof ProfileEditorInitial>(k: K, val: ProfileEditorInitial[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function run(tab: string, fn: () => Promise<ActionResult>) {
    setSaving(tab);
    const res = await fn();
    setSaving(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Mentve");
    router.refresh();
  }

  // Per-platform automatikus összekapcsolás (csak TikTok / YouTube).
  async function connectOne(platform: "tiktok" | "youtube") {
    const url = platform === "tiktok" ? v.tiktokUrl : v.youtubeUrl;
    if (!url.trim()) {
      toast.error("Előbb illeszd be a profil URL-jét");
      return;
    }
    setConnecting(platform);
    const res = await connectCreatorSocials(
      platform === "tiktok" ? { tiktokUrl: url } : { youtubeUrl: url }
    );
    setConnecting(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    const fetched =
      platform === "tiktok" ? res.tiktokFollowers : res.youtubeSubscribers;
    if (fetched != null) {
      setV((prev) => ({
        ...prev,
        ...(platform === "tiktok"
          ? { tiktokFollowers: String(fetched) }
          : { youtubeSubscribers: String(fetched) }),
      }));
      toast.success("Összekapcsolva — a számot behúztuk!");
    } else {
      toast.warning(
        "Most nem sikerült lekérni. A 4 napos automatikus frissítés újrapróbálja."
      );
    }
    router.refresh();
  }

  // Bemutatkozó videó azonnali mentése (feltöltés/eltávolítás után).
  async function saveIntroVideo(url: string | null) {
    set("introVideoUrl", url);
    const res = await updateCreatorIntroVideo({ introVideoUrl: url });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    router.refresh();
  }

  // Ha van social URL, hozzá tartozó követő/feliratkozó szám is kell.
  function saveSocial() {
    const missingCount = [
      { label: "Instagram", url: v.instagramUrl, count: v.instagramFollowers },
      { label: "TikTok", url: v.tiktokUrl, count: v.tiktokFollowers },
      { label: "Facebook", url: v.facebookUrl, count: v.facebookFollowers },
      { label: "YouTube", url: v.youtubeUrl, count: v.youtubeSubscribers },
    ].find((item) => item.url.trim() && !(Number(item.count) > 0));

    if (missingCount) {
      toast.error(`Add meg a(z) ${missingCount.label} követő/feliratkozó számát is.`);
      return;
    }

    run("social", () =>
      updateCreatorSocial({
        instagramUrl: v.instagramUrl,
        instagramFollowers: v.instagramFollowers ? Number(v.instagramFollowers) : null,
        tiktokUrl: v.tiktokUrl,
        tiktokFollowers: v.tiktokFollowers ? Number(v.tiktokFollowers) : null,
        facebookUrl: v.facebookUrl,
        facebookFollowers: v.facebookFollowers ? Number(v.facebookFollowers) : null,
        youtubeUrl: v.youtubeUrl,
        youtubeSubscribers: v.youtubeSubscribers ? Number(v.youtubeSubscribers) : null,
      })
    );
  }

  return (
    <div className="space-y-6">
      {/* FEJLÉC-KÁRTYA: avatar + kitöltöttség + előnyök */}
      <ProfileHeaderCard
        avatarUrl={v.avatarUrl}
        displayName={v.displayName}
        username={v.username}
        score={score}
        verified={isVerified}
      />

      {/* HITELESÍTÉS */}
      {isVerified ? (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/[0.08] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#3f6212]">
              Hitelesített profil
            </p>
            <p className="text-xs text-muted-foreground">
              A profilod mellett megjelenik a hitelesített jelvény — ez növeli a
              márkák bizalmát.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-base font-bold">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Hitelesítsd a profilod
              </p>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Töltsd ki az alábbiakat, majd kattints a hitelesítésre. Utána a
                neved mellett megjelenik a hitelesített jelvény.
              </p>
            </div>
            <Button
              type="button"
              onClick={runVerify}
              disabled={!canVerify || verifying}
              className="bg-accent font-semibold text-black hover:bg-accent/90"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              Hitelesítés
            </Button>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {verifyChecks.map((c) => (
              <li
                key={c.label}
                className={`flex items-center gap-2 text-sm ${
                  c.ok ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {c.ok ? (
                  <BadgeCheck className="h-4 w-4 text-accent" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-black/20" />
                )}
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="basics" className="w-full space-y-4">
        <div className="rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm">
          <TabsList className="flex h-auto w-full gap-1.5 rounded-none bg-transparent p-0">
            {(
              [
                ["basics", "Alapadatok"],
                ["appearance", "Megjelenés"],
                ["social", "Social fiókok"],
              ] as const
            ).map(([val, label]) => (
              <TabsTrigger
                key={val}
                value={val}
                className="h-10 flex-1 whitespace-nowrap rounded-xl px-2 text-xs font-bold text-muted-foreground after:hidden data-active:bg-accent data-active:text-black data-active:shadow-sm sm:h-11 sm:px-3 sm:text-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

      {/* ALAPADATOK */}
      <TabsContent value="basics">
        <Card>
          <CardHeader>
            <CardTitle>Alapadatok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Megjelenített név</Label>
              <Input
                value={v.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Felhasználónév</Label>
              <Input
                value={v.username}
                onChange={(e) => set("username", generateUsername(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bemutatkozás</Label>
              <Textarea
                value={v.bio}
                maxLength={BIO_MAX_LENGTH}
                rows={4}
                onChange={(e) => set("bio", e.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">
                {v.bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Város</Label>
                <Input value={v.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Megye</Label>
                <Select value={v.county || undefined} onValueChange={(val) => set("county", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz megyét" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUNGARIAN_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Születési dátum</Label>
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={v.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A profilodon csak az életkorod látszik.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Nem</Label>
                <Select value={v.gender || undefined} onValueChange={(val) => set("gender", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategóriák (max {MAX_CREATOR_CATEGORIES})</Label>
              <ChipMultiSelect
                options={CREATOR_CATEGORIES}
                value={v.categories}
                onChange={(n) => set("categories", n)}
                max={MAX_CREATOR_CATEGORIES}
              />
            </div>
            <div className="space-y-2">
              <Label>Nyelvek</Label>
              <ChipMultiSelect
                options={LANGUAGES}
                value={v.languages}
                onChange={(n) => set("languages", n)}
              />
            </div>
            <SaveButton
              loading={saving === "basics"}
              onClick={() =>
                run("basics", () =>
                  updateCreatorBasics({
                    username: v.username,
                    displayName: v.displayName,
                    bio: v.bio,
                    city: v.city,
                    county: v.county,
                    birthDate: v.birthDate,
                    gender: v.gender,
                    categories: v.categories,
                    languages: v.languages,
                  })
                )
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* MEGJELENÉS */}
      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Megjelenés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUploader
              bucket="avatars"
              variant="avatar"
              label="Profilkép"
              value={v.avatarUrl}
              onChange={(url) => set("avatarUrl", url)}
            />
            <div className="h-px bg-border" />
            <IntroVideoUploader
              value={v.introVideoUrl}
              onChange={(url) => saveIntroVideo(url)}
            />
            <SaveButton
              loading={saving === "appearance"}
              onClick={() =>
                run("appearance", () =>
                  updateCreatorAppearance({
                    avatarUrl: v.avatarUrl,
                  })
                )
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* SOCIAL — TikTok/YouTube automata; Instagram/Facebook kézi (kötelező) */}
      <TabsContent value="social">
        <Card>
          <CardHeader>
            <CardTitle>Social fiókok</CardTitle>
            <CardDescription>
              Add meg közösségi média fiókjaidat, hogy könnyebben elérhető
              legyél.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TikTok — automata */}
            <SocialAutoRow
              platform="tiktok"
              label="TikTok"
              unit="követő"
              url={v.tiktokUrl}
              count={v.tiktokFollowers}
              onUrl={(val) => set("tiktokUrl", val)}
              onCount={(val) => set("tiktokFollowers", val)}
              onConnect={() => connectOne("tiktok")}
              connecting={connecting === "tiktok"}
              showCount
              officialHref="/api/auth/tiktok/start"
              official={v.tiktokOfficial}
              onDisconnect={disconnectTt}
              disconnecting={disconnectingTt}
            />

            {/* YouTube — automata */}
            <SocialAutoRow
              platform="youtube"
              label="YouTube"
              unit="feliratkozó"
              url={v.youtubeUrl}
              count={v.youtubeSubscribers}
              onUrl={(val) => set("youtubeUrl", val)}
              onCount={(val) => set("youtubeSubscribers", val)}
              onConnect={() => connectOne("youtube")}
              connecting={connecting === "youtube"}
            />

            {/* Elválasztó + kézi-megadás magyarázat IG/FB ikon-chipekkel */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex shrink-0 items-center gap-1.5">
                <SocialTile platform="instagram" className="h-6 w-6" />
                <SocialTile platform="facebook" className="h-6 w-6" />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Az Instagram és a Facebook követőszámát kézzel kell megadni — ha
                megadod a linket, a követőszám kötelező.
              </p>
            </div>

            {/* Instagram — kézi */}
            <SocialManualRow
              platform="instagram"
              label="Instagram"
              unit="követő"
              url={v.instagramUrl}
              count={v.instagramFollowers}
              onUrl={(val) => set("instagramUrl", val)}
              onCount={(val) => set("instagramFollowers", val)}
            />

            {/* Facebook — kézi */}
            <SocialManualRow
              platform="facebook"
              label="Facebook"
              unit="követő"
              url={v.facebookUrl}
              count={v.facebookFollowers}
              onUrl={(val) => set("facebookUrl", val)}
              onCount={(val) => set("facebookFollowers", val)}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={saveSocial}
                disabled={saving === "social"}
                className="bg-accent font-semibold text-black hover:bg-accent/90"
              >
                {saving === "social" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Mentés
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}

/** Fejléc-kártya: avatar, név, kitöltöttség, hitelesítés + 3 előny-kártya. */
function ProfileHeaderCard({
  avatarUrl,
  displayName,
  username,
  score,
  verified,
}: {
  avatarUrl: string | null;
  displayName: string;
  username: string;
  score: number;
  verified: boolean;
}) {
  const benefits = [
    {
      icon: Sparkles,
      title: "Nagyobb láthatóság",
      desc: "A teljes profil több lehetőséget hoz.",
    },
    {
      icon: Users,
      title: "Hitelesség",
      desc: "Az ellenőrzött adatok növelik a bizalmat.",
    },
    {
      icon: TrendingUp,
      title: "Több ajánlat",
      desc: "A márkák könnyebben megtalálnak.",
    },
  ];
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        {/* Bal: avatar + név + kitöltöttség */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-black/5"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f0f4e5] text-xl font-bold">
              {(displayName || username || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-bold">
                {displayName || username}
              </span>
              <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-[#3f6212]">
                {score}% kész
              </span>
            </div>
            {verified ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[#3f6212]">
                <BadgeCheck className="h-4 w-4 text-accent" />
                Ellenőrzött alkotó
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Kapcsold össze a fiókjaid a hitelesítéshez
              </p>
            )}
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Az adatok kitöltése segít, hogy több releváns együttműködést
              találj.
            </p>
          </div>
        </div>

        {/* Jobb: 3 előny-kártya */}
        <div className="grid gap-2 sm:grid-cols-3 lg:gap-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-xl border border-black/10 bg-[#f6f7f2] p-3 lg:w-[180px]"
              >
                <Icon className="h-5 w-5 text-accent" />
                <p className="mt-1.5 text-sm font-semibold">{b.title}</p>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Automata sor: URL + „Összekapcsol" (a követőt scrape/AI húzza be).
 *  - showCount: kézi {unit}szám mező is megjelenik (TikTok — ha a scrape nem
 *    fogná, kézzel is megadható).
 *  - officialHref: a sor alatt megjelenik a hivatalos TikTok-összekötés gomb is
 *    (a TikTok jóváhagyása után ez lesz a pontos, hitelesített forrás).
 */
function SocialAutoRow({
  platform,
  label,
  unit,
  url,
  count,
  onUrl,
  onCount,
  onConnect,
  connecting,
  showCount,
  officialHref,
  official,
  onDisconnect,
  disconnecting,
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
  showCount?: boolean;
  officialHref?: string;
  official?: boolean;
  onDisconnect?: () => void;
  disconnecting?: boolean;
}) {
  const hasCount = Number(count) > 0;
  const needsCount = Boolean(showCount) && url.trim().length > 0 && !hasCount;

  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-3">
      <div
        className={
          showCount
            ? "grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)] lg:grid-cols-[56px_minmax(0,1fr)_160px_auto] lg:items-end"
            : "grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)] lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-end"
        }
      >
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
        {showCount ? (
          <div className="min-w-0">
            <Label className="text-sm">{unit}szám</Label>
            <NumberInput
              value={count}
              onChange={onCount}
              placeholder="pl. 24 500"
              className="mt-1.5"
            />
          </div>
        ) : null}
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
      ) : needsCount ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Kattints az „Összekapcsol"-ra a behúzáshoz, vagy add meg kézzel a {unit}számot.
        </p>
      ) : url.trim().length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Kattints az „Összekapcsol"-ra a {unit}szám automatikus behúzásához.
        </p>
      ) : null}

      {officialHref ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-3">
          {official ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f6212]">
              <BadgeCheck className="h-4 w-4 text-accent" />
              Hivatalosan összekötve — a statok közvetlenül a TikToktól jönnek
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Vagy hitelesítsd a pontos statokat a TikTok hivatalos összekötésével:
            </span>
          )}
          <Button asChild size="sm" className="bg-black text-white hover:bg-black/85">
            <a href={officialHref}>
              <SocialTile platform="tiktok" className="h-4 w-4 rounded" />
              {official ? "Újraszinkronizálás" : "Hivatalos TikTok összekötés"}
            </a>
          </Button>
          {official && onDisconnect ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Szétkapcsolás
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Kézi sor: nagy logó-csempe + URL + kötelező követőszám mező (IG/FB). */
function SocialManualRow({
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
  // Magyar névelő: magánhangzóval kezdődő szó előtt "Az", egyébként "A".
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
            placeholder="https://…"
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

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button type="button" onClick={onClick} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Mentés
      </Button>
    </div>
  );
}
