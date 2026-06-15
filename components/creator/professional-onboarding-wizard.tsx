"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Plus,
  Trash2,
  Lightbulb,
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
import { ImageUploader } from "@/components/creator/image-uploader";
import { PortfolioEmbed } from "@/components/shared/portfolio-embed";
import {
  PROFESSIONAL_ROLES,
  SPECIALTY_SUGGESTIONS,
  HUNGARIAN_COUNTIES,
} from "@/lib/constants";
import { generateUsername } from "@/lib/utils/slug";
import { completeProfessionalOnboarding } from "@/app/actions/professional-profile";
import { triggerVerificationEmail } from "@/app/actions/auth";

export type ProfessionalOnboardingInitial = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  city: string;
  county: string;
  professionalRoles: string[];
  specialties: string[];
  websiteUrl: string;
  instagramUrl: string;
};

type PortfolioLink = { url: string; title: string };

const STEPS = ["Alapadatok", "Szerepkör", "Portfólió", "Linkek & mentés"];
const MAX_PORTFOLIO = 15;

export function ProfessionalOnboardingWizard({
  initial,
}: {
  initial: ProfessionalOnboardingInitial;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [v, setV] = useState<ProfessionalOnboardingInitial>(initial);
  const [portfolio, setPortfolio] = useState<PortfolioLink[]>([{ url: "", title: "" }]);
  const [customSpecialty, setCustomSpecialty] = useState("");

  function set<K extends keyof ProfessionalOnboardingInitial>(
    key: K,
    val: ProfessionalOnboardingInitial[K],
  ) {
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
      if (!v.avatarUrl) return "Tölts fel egy profilképet";
      if (v.displayName.trim().length < 2)
        return "Adj meg egy megjelenített nevet (min. 2 karakter)";
      if (generateUsername(v.username).length < 3)
        return "A felhasználónév min. 3 karakter (ékezet nélkül)";
    }
    if (step === 1) {
      if (v.professionalRoles.length < 1) return "Válassz legalább egy szerepkört";
    }
    if (step === 2) {
      const filled = portfolio.filter((p) => p.url.trim());
      if (filled.length < 1) return "Adj meg legalább 1 portfólió linket";
      const bad = filled.find((p) => !/^https?:\/\/\S+/.test(p.url.trim()));
      if (bad) return "Az egyik link érvénytelen (http(s)://-rel kezdődjön)";
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

  function addSpecialty(s: string) {
    const clean = s.trim();
    if (!clean || v.specialties.includes(clean) || v.specialties.length >= 15) return;
    set("specialties", [...v.specialties, clean]);
  }

  async function save() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    let res: { error?: string; success?: boolean };
    try {
      res = await completeProfessionalOnboarding({
        displayName: v.displayName,
        username: v.username,
        avatarUrl: v.avatarUrl ?? "",
        bio: v.bio,
        city: v.city,
        county: v.county,
        professionalRoles: v.professionalRoles,
        specialties: v.specialties,
        portfolio: portfolio
          .filter((p) => p.url.trim())
          .map((p) => ({ url: p.url.trim(), title: p.title.trim() })),
        websiteUrl: v.websiteUrl.trim(),
        instagramUrl: v.instagramUrl.trim(),
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
    // Email-megerősítés — a küldés hibája NEM akadályozhatja az átirányítást.
    try {
      await triggerVerificationEmail();
    } catch {
      // ignoráljuk
    }
    // Hard navigáció: a router.push néha nem navigál Server Action után.
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
          {step + 1}. lépés a {STEPS.length}-ből — kreatív szakember profil beállítása
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 0 && (
          <>
            <ImageUploader
              bucket="avatars"
              variant="avatar"
              label="Profilkép *"
              value={v.avatarUrl}
              onChange={(url) => set("avatarUrl", url)}
            />
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Megjelenített név *</Label>
              <Input
                id="displayName"
                value={v.displayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="pl. Nagy Péter"
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
                    set("username", e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Rövid bemutatkozás</Label>
              <Textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={v.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Mesélj röviden magadról és a munkáidról… (max 500 karakter)"
              />
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
                <Select value={v.county} onValueChange={(val) => set("county", val)}>
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
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>Szerepkör(ök) * — több is választható</Label>
              <ChipMultiSelect
                options={PROFESSIONAL_ROLES}
                value={v.professionalRoles}
                onChange={(next) => set("professionalRoles", next)}
              />
            </div>
            <div className="space-y-2">
              <Label>Szakterületek (opcionális)</Label>
              <ChipMultiSelect
                options={SPECIALTY_SUGGESTIONS.map((s) => ({ value: s, label: s }))}
                value={v.specialties}
                onChange={(next) => set("specialties", next)}
                max={15}
              />
              <div className="flex gap-2">
                <Input
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  placeholder="Saját szakterület hozzáadása…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty(customSpecialty);
                      setCustomSpecialty("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addSpecialty(customSpecialty);
                    setCustomSpecialty("");
                  }}
                >
                  <Plus className="h-4 w-4" /> Hozzáad
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex gap-2 rounded-xl border border-accent/40 bg-[#f0f4e5] p-3 text-sm leading-6 text-[#3f6212]">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Google Drive videó megosztása:</strong> a videó megosztási
                beállítása legyen <strong>„Bárki a link birtokában megtekintheti"</strong>,
                különben az előnézet nem töltődik be. Másold be a megosztási linket
                (pl. <code className="text-xs">https://drive.google.com/file/d/…/view</code>).
              </p>
            </div>

            {portfolio.map((item, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <Label>{i + 1}. munka</Label>
                  {portfolio.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPortfolio((prev) => prev.filter((_, j) => j !== i))}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
                      aria-label="Elem törlése"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Input
                  value={item.url}
                  onChange={(e) =>
                    setPortfolio((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, url: e.target.value } : p)),
                    )
                  }
                  placeholder="https://drive.google.com/file/d/… vagy YouTube / Vimeo / egyéb link"
                />
                <Input
                  value={item.title}
                  onChange={(e) =>
                    setPortfolio((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, title: e.target.value } : p)),
                    )
                  }
                  placeholder="Cím (opcionális, pl. „Esküvői highlight film”)"
                />
                {/^https?:\/\/\S+/.test(item.url.trim()) && (
                  <PortfolioEmbed url={item.url.trim()} title={item.title || undefined} />
                )}
              </div>
            ))}

            {portfolio.length < MAX_PORTFOLIO && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setPortfolio((prev) => [...prev, { url: "", title: "" }])}
              >
                <Plus className="h-4 w-4" /> Új portfólió elem ({portfolio.length}/
                {MAX_PORTFOLIO})
              </Button>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted-foreground">
              Opcionális linkek — segítenek a márkáknak jobban megismerni a munkáidat.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="websiteUrl">Weboldal / Behance</Label>
              <Input
                id="websiteUrl"
                value={v.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                value={v.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/…"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
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
            <Button type="button" onClick={save} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Profil mentése
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
