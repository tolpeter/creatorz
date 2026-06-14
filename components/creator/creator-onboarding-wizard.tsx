"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  BadgeCheck,
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
import { formatNumber } from "@/lib/utils/format";
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
  age: string;
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

export function CreatorOnboardingWizard({ initial }: { initial: OnboardingInitial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
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
    }
    if (step === 1) {
      if (v.languages.length < 1) return "Válassz legalább egy nyelvet";
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

  async function connectSocials() {
    if (!v.instagramUrl && !v.tiktokUrl && !v.facebookUrl && !v.youtubeUrl) {
      toast.error("Adj meg legalább egy social profil linket");
      return;
    }
    setConnecting(true);
    const res = await connectCreatorSocials({
      instagramUrl: v.instagramUrl,
      tiktokUrl: v.tiktokUrl,
      facebookUrl: v.facebookUrl,
      youtubeUrl: v.youtubeUrl,
    });
    setConnecting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setV((prev) => ({
      ...prev,
      instagramFollowers:
        res.instagramFollowers != null ? String(res.instagramFollowers) : prev.instagramFollowers,
      tiktokFollowers:
        res.tiktokFollowers != null ? String(res.tiktokFollowers) : prev.tiktokFollowers,
      facebookFollowers:
        res.facebookFollowers != null ? String(res.facebookFollowers) : prev.facebookFollowers,
      youtubeSubscribers:
        res.youtubeSubscribers != null ? String(res.youtubeSubscribers) : prev.youtubeSubscribers,
    }));
    const failed = res.failed ?? [];
    if (failed.length > 0) {
      toast.warning(
        `Összekapcsolva. Ezeket nem sikerült most lekérni: ${failed.join(", ")}. Később automatikusan újrapróbáljuk.`
      );
    } else {
      toast.success("Összekapcsolva — a számokat behúztuk!");
    }
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    const res = await completeCreatorOnboarding({
      username: v.username,
      displayName: v.displayName,
      bio: v.bio,
      city: v.city,
      county: v.county,
      age: v.age ? Number(v.age) : null,
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
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Profil elmentve!");
    // Még egy utolsó lépés: email-megerősítés
    await triggerVerificationEmail();
    router.push("/verify-email");
    router.refresh();
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
                <Label htmlFor="age">Kor (opcionális)</Label>
                <Input
                  id="age"
                  type="number"
                  min={13}
                  max={100}
                  value={v.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nem (opcionális)</Label>
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
            <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-accent" />
                Csak a linket add meg — a számokat az AI behúzza
              </p>
              <p className="mt-1 text-muted-foreground">
                Illeszd be a profiljaid linkjét, és kattints az
                <strong> „Összekapcsol” </strong> gombra. A követő- és
                feliratkozószámokat automatikusan lekérjük, és onnantól 4
                naponta frissítjük. Ez a lépés kihagyható, később is megteheted
                a profilodnál.
              </p>
            </div>
            {(
              [
                ["instagramUrl", "instagramFollowers", "Instagram", "követő"],
                ["tiktokUrl", "tiktokFollowers", "TikTok", "követő"],
                ["facebookUrl", "facebookFollowers", "Facebook", "követő"],
                ["youtubeUrl", "youtubeSubscribers", "YouTube", "feliratkozó"],
              ] as const
            ).map(([urlKey, followKey, label, unit]) => {
              const count = v[followKey];
              return (
                <div key={label} className="space-y-1.5">
                  <Label>{label} profil URL</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={v[urlKey]}
                      onChange={(e) => set(urlKey, e.target.value)}
                      placeholder="https://…"
                      className="sm:flex-1"
                    />
                    <div className="flex min-w-[150px] items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm">
                      {count ? (
                        <>
                          <BadgeCheck className="h-4 w-4 text-accent" />
                          <span className="font-semibold">
                            {formatNumber(Number(count))}
                          </span>
                          <span className="text-muted-foreground">{unit}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Még nincs adat</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={connectSocials}
                disabled={connecting}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {connecting ? "Összekapcsolás…" : "Összekapcsol"}
              </Button>
            </div>
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
