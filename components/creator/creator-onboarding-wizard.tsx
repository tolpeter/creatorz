"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  CREATOR_CATEGORIES,
  HUNGARIAN_COUNTIES,
  LANGUAGES,
  GENDER_OPTIONS,
  BIO_MAX_LENGTH,
  MAX_CREATOR_CATEGORIES,
} from "@/lib/constants";
import { generateUsername } from "@/lib/utils/slug";
import {
  SocialAutoRow,
  SocialManualRow,
} from "@/components/creator/social-rows";
import { SocialTile } from "@/components/creator/platform-icon";
import {
  completeCreatorOnboarding,
  connectCreatorSocials,
} from "@/app/actions/creator-profile";
import { triggerVerificationEmail } from "@/app/actions/auth";

export type OnboardingInitial = {
  username: string;
  displayName: string;
  bio: string;
  city: string;
  county: string;
  birthDate: string;
  gender: string;
  categories: string[];
  languages: string[];
  instagramUrl: string;
  instagramFollowers: string;
  tiktokUrl: string;
  tiktokFollowers: string;
  facebookUrl: string;
  facebookFollowers: string;
  youtubeUrl: string;
  youtubeSubscribers: string;
};

const STEPS = ["Alapadatok", "Kategória & nyelvek", "Social fiókok"];

/** Életkor ISO (YYYY-MM-DD) születési dátumból. */
function ageFromIso(iso: string): number {
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function CreatorOnboardingWizard({ initial }: { initial: OnboardingInitial }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<"tiktok" | "youtube" | null>(null);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [v, setV] = useState<OnboardingInitial>(initial);

  function set<K extends keyof OnboardingInitial>(key: K, val: OnboardingInitial[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  function onDisplayNameChange(name: string) {
    setV((prev) => ({
      ...prev,
      displayName: name,
      username: usernameEdited ? prev.username : generateUsername(name),
    }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (v.displayName.trim().length < 2) return "Adj meg egy megjelenített nevet (min. 2 karakter)";
      if (generateUsername(v.username).length < 3) return "A felhasználónév min. 3 karakter (ékezet nélkül)";
      if (!v.birthDate) return "Add meg a születési dátumod";
      const age = ageFromIso(v.birthDate);
      if (age < 13 || age > 100) return "Az életkornak 13 és 100 év között kell lennie";
      if (!v.gender) return "Válaszd ki a nemed";
    }
    if (step === 1) {
      if (v.languages.length < 1) return "Válassz legalább egy nyelvet";
    }
    if (step === 2) {
      // Ha egy social URL ki van töltve, a követőszám is kötelező (vagy
      // szinkronból, vagy manuálisan megadva).
      const missing = (
        [
          [v.instagramUrl, v.instagramFollowers, "Instagram"],
          [v.tiktokUrl, v.tiktokFollowers, "TikTok"],
          [v.facebookUrl, v.facebookFollowers, "Facebook"],
          [v.youtubeUrl, v.youtubeSubscribers, "YouTube"],
        ] as const
      ).find(([url, count]) => url.trim() && !(Number(count) > 0));
      if (missing) {
        return `Add meg a(z) ${missing[2]} követő/feliratkozó számát (vagy töröld a linket).`;
      }
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  // Csak TikTok és YouTube szinkronizálható automatikusan. (Instagram/Facebook
  // követőszámot kézzel kell megadni — lásd lent.)
  async function connectOne(platform: "tiktok" | "youtube") {
    const url = platform === "tiktok" ? v.tiktokUrl : v.youtubeUrl;
    if (!url.trim()) {
      toast.error("Előbb illeszd be a profil URL-jét");
      return;
    }
    setConnecting(platform);
    const res = await connectCreatorSocials(
      platform === "tiktok" ? { tiktokUrl: url } : { youtubeUrl: url },
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
        "Most nem sikerült lekérni — add meg kézzel a számot. A 4 napos frissítés később újrapróbálja.",
      );
    }
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    let res: { error?: string; success?: boolean };
    try {
      res = await completeCreatorOnboarding({
        username: v.username,
        displayName: v.displayName,
        bio: v.bio,
        city: v.city,
        county: v.county,
        birthDate: v.birthDate,
        gender: v.gender,
        categories: v.categories,
        languages: v.languages,
        instagramUrl: v.instagramUrl,
        instagramFollowers: v.instagramFollowers ? Number(v.instagramFollowers) : null,
        tiktokUrl: v.tiktokUrl,
        tiktokFollowers: v.tiktokFollowers ? Number(v.tiktokFollowers) : null,
        facebookUrl: v.facebookUrl,
        facebookFollowers: v.facebookFollowers ? Number(v.facebookFollowers) : null,
        youtubeUrl: v.youtubeUrl,
        youtubeSubscribers: v.youtubeSubscribers ? Number(v.youtubeSubscribers) : null,
      });
    } catch {
      setLoading(false);
      toast.error("Hiba a mentés közben. Próbáld újra.");
      return;
    }
    if (res.error) {
      setLoading(false);
      toast.error(res.error);
      return;
    }
    toast.success("Profil elmentve!");
    // Email-megerősítés kiküldése — a hibája NEM akadályozhatja az átirányítást.
    try {
      await triggerVerificationEmail();
    } catch {
      // ignoráljuk
    }
    // Hard navigáció: a router.push néha nem navigál Server Action után
    // (revalidation-ütközés). A window.location MINDIG átvisz.
    window.location.href = "/verify-email";
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mb-3 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step
                    ? "bg-accent text-accent-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
        <CardTitle>{STEPS[step]}</CardTitle>
        <CardDescription>
          {step + 1}. lépés a {STEPS.length}-ből — tartalomgyártó profil beállítása
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 0 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Megjelenített név *</Label>
              <Input
                id="displayName"
                value={v.displayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="pl. Kovács Anna"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Felhasználónév (profil link) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">creatorz.hu/creators/</span>
                <Input
                  id="username"
                  value={v.username}
                  onChange={(e) => {
                    setUsernameEdited(true);
                    set("username", generateUsername(e.target.value));
                  }}
                  placeholder="kovacs-anna"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bemutatkozás</Label>
              <Textarea
                id="bio"
                value={v.bio}
                maxLength={BIO_MAX_LENGTH}
                onChange={(e) => set("bio", e.target.value)}
                rows={4}
                placeholder="Mesélj magadról és a tartalmaidról…"
              />
              <p className="text-right text-xs text-muted-foreground">
                {v.bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Város</Label>
                <Input
                  id="city"
                  value={v.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="pl. Budapest"
                />
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
                <Label htmlFor="birthDate">Születési dátum *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={v.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A profilodon csak az életkorod jelenik meg, a pontos dátum nem.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Nem *</Label>
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
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>
                Stílus / kategória (max {MAX_CREATOR_CATEGORIES})
              </Label>
              <ChipMultiSelect
                options={CREATOR_CATEGORIES}
                value={v.categories}
                onChange={(next) => set("categories", next)}
                max={MAX_CREATOR_CATEGORIES}
              />
            </div>
            <div className="space-y-2">
              <Label>Beszélt nyelvek *</Label>
              <ChipMultiSelect
                options={LANGUAGES}
                value={v.languages}
                onChange={(next) => set("languages", next)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted-foreground">
              Ez a lépés kihagyható, később a profilodnál is megteheted. Ha
              kitöltesz egy linket, a követőszám megadása kötelező.
            </p>

            {/* TikTok — automata szinkron */}
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
            />

            {/* YouTube — automata szinkron */}
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

            {/* IG/FB — kézi megadás magyarázat */}
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
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
          >
            <ArrowLeft className="h-4 w-4" /> Vissza
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Tovább <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Profil mentése
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
