"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

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
import { RateCardEditor, type RateCardItem } from "@/components/creator/rate-card-editor";
import {
  CREATOR_CATEGORIES,
  HUNGARIAN_COUNTIES,
  LANGUAGES,
  GENDER_OPTIONS,
  BIO_MAX_LENGTH,
  MAX_CREATOR_CATEGORIES,
} from "@/lib/constants";
import { generateUsername } from "@/lib/utils/slug";
import { completeCreatorOnboarding } from "@/app/actions/creator-profile";

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
  rateCard: RateCardItem[];
};

const STEPS = ["Alapadatok", "Kategória & nyelvek", "Social", "Rate card"];

export function CreatorOnboardingWizard({ initial }: { initial: OnboardingInitial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
    if (step === 3) {
      if (v.rateCard.length < 1) return "Adj hozzá legalább egy szolgáltatást a rate card-hoz";
      if (v.rateCard.some((r) => !r.service.trim() || !(r.priceHuf > 0)))
        return "Minden szolgáltatáshoz adj nevet és 0-nál nagyobb árat";
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
      rateCard: v.rateCard,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Profil elmentve!");
    router.push("/creator");
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
          {step + 1}. lépés a {STEPS.length}-ből — creator profil beállítása
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
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              A követőszámokat heti automatikus ellenőrzéssel frissítjük. A V2-ben
              hivatalos OAuth verifikáció érkezik.
            </p>
            {(
              [
                ["instagramUrl", "instagramFollowers", "Instagram", "követő"],
                ["tiktokUrl", "tiktokFollowers", "TikTok", "követő"],
                ["facebookUrl", "facebookFollowers", "Facebook", "követő"],
                ["youtubeUrl", "youtubeSubscribers", "YouTube", "feliratkozó"],
              ] as const
            ).map(([urlKey, followKey, label, unit]) => (
              <div key={label} className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <div className="space-y-1.5">
                  <Label>{label} URL</Label>
                  <Input
                    value={v[urlKey]}
                    onChange={(e) => set(urlKey, e.target.value)}
                    placeholder={`https://…`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{unit}szám</Label>
                  <Input
                    type="number"
                    min={0}
                    value={v[followKey]}
                    onChange={(e) => set(followKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <RateCardEditor value={v.rateCard} onChange={(next) => set("rateCard", next)} />
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Portfólió elemeket (videó/fotó) a profil elkészülte után a{" "}
              <strong>Portfolio</strong> oldalon tölthetsz fel.
            </p>
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
