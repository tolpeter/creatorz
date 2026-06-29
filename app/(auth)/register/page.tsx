"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signUpAction } from "@/app/actions/auth";
import { ReferralCapture } from "@/components/auth/referral-capture";
import { GoogleButton } from "@/components/auth/google-button";
import { fbTrack } from "@/lib/analytics/fb";
import { CREATOR_TYPES } from "@/lib/constants";

type CreatorType = "ugc" | "influencer" | "model";

// UI-választás: a "professional" valójában creator role + professional profileKind
type RoleChoice = "creator" | "professional" | "brand";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleChoice | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatorType, setCreatorType] = useState<CreatorType>("ugc");
  const [gdpr, setGdpr] = useState(false);
  const [loading, setLoading] = useState(false);

  function chooseRole(r: RoleChoice) {
    setRole(r);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const res = await signUpAction({
      role: role === "brand" ? "brand" : "creator",
      profileKind: role === "professional" ? "professional" : "ugc",
      creatorType: role === "creator" ? creatorType : "ugc",
      email,
      password,
      gdpr,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    // Facebook/Meta konverziómérés: sikeres regisztráció (csak ha a felhasználó
    // hozzájárult a marketing-sütikhez — egyébként a fbq csendben elnyeli).
    fbTrack("CompleteRegistration", {
      content_name: role,
      status: true,
    });

    // Sikeres signup → onboarding wizard. A megerősítő emailt az onboarding
    // VÉGÉN küldjük ki, és a /verify-email oldalra terelünk.
    toast.success("Sikeres regisztráció! Folytasd a profilod kitöltésével.");
    router.push(res.redirectTo ?? "/dashboard");
    router.refresh();
  }

  // (A korábbi "check email" képernyő törölve — a verifikáció az onboarding
  //  után fut, a /verify-email oldalon.)

  // ---- 1. lépés: szerepválasztás ----
  if (step === 1) {
    return (
      <div className="relative w-full max-w-5xl rounded-3xl">
        <ReferralCapture />
        <div className="relative space-y-8">
          <div className="space-y-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-[#f0f4e5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f6212]">
              <Sparkles className="h-3.5 w-3.5" />
              Ingyenes csatlakozás
            </span>
            <h1 className="text-balance text-3xl font-black sm:text-4xl">
              Csatlakozz a <span className="text-[#4d7c0f]">Creatorz</span>-hoz
            </h1>
            <p className="text-muted-foreground">
              Válaszd ki, hogyan szeretnél regisztrálni
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <RoleCard
              onClick={() => chooseRole("creator")}
              alt="UGC tartalomgyártó, influencer, modell vagyok"
              image="/images/register-creator.webp"
            />
            <ProfessionalRoleCard onClick={() => chooseRole("professional")} />
            <RoleCard
              onClick={() => chooseRole("brand")}
              alt="Márka vagyok"
              image="/images/register-brand.webp"
            />
          </div>

          <div className="mx-auto mt-7 w-full max-w-sm">
            <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              VAGY GYORSAN
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleButton label="Regisztráció Google-fiókkal" />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              A neved és emailed automatikusan kitöltjük — utána csak a szerepkört választod ki.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Van már fiókod?{" "}
            <Link
              href="/login"
              className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2 hover:text-accent"
            >
              Jelentkezz be
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ---- 2. lépés: űrlap (split-screen) ----
  const isCreator = role === "creator";
  const isProfessional = role === "professional";
  const benefits = isProfessional
    ? [
        "Portfólió-alapú profil, linkekkel",
        "Drive / YouTube videóid beágyazva",
        "Márkák találnak meg a munkáid alapján",
      ]
    : isCreator
      ? [
          "Ingyenes profil, 2 perc alatt kész",
          "Pályázz márka-briefekre",
          "Építs portfóliót és gyűjts értékeléseket",
        ]
      : [
          "Találd meg a tökéletes alkotót",
          "Adj fel briefet — ingyen",
          "Közvetlen kapcsolat, gyors együttműködés",
        ];

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] lg:grid-cols-2">
      {/* BAL: brandelt, animált panel */}
      <div className="relative hidden min-h-[600px] overflow-hidden bg-[#0a0a0a] lg:block">
        <Image
          src="/images/generated/login-hero.webp?v=2"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.35)_0%,rgba(10,10,10,0.6)_55%,rgba(10,10,10,0.96)_100%)]"
        />
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
          style={{ animationDelay: "5s" }}
        />
        <div
          aria-hidden
          className="animate-float absolute right-6 top-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/55 px-3 py-2 text-white backdrop-blur"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold">100% magyar közösség</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {isProfessional
              ? "Kreatív szakembereknek"
              : isCreator
                ? "Alkotóknak (UGC, influencer, modell)"
                : "Márkáknak"}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-black leading-tight">
            Csatlakozz a <span className="text-accent">Creatorz</span>-hoz
          </h2>
          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {benefits.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* JOBB: regisztrációs űrlap */}
      <div className="animate-slide-up flex flex-col justify-center p-7 sm:p-10">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Vissza
        </button>

        <h1 className="text-2xl font-black sm:text-3xl">
          {isProfessional
            ? "Kreatív szakember regisztráció"
            : isCreator
              ? "Alkotói regisztráció"
              : "Márka regisztráció"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add meg az adataidat a fiók létrehozásához.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isCreator && (
            <div className="space-y-1.5">
              <Label>Milyen típusú alkotó vagy?</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {CREATOR_TYPES.map((t) => {
                  const active = creatorType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCreatorType(t.value as CreatorType)}
                      className={`rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                        active
                          ? "border-accent bg-[#f0f4e5] ring-1 ring-accent"
                          : "border-black/10 bg-white hover:border-black/25"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email cím</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="te@pelda.hu"
                className="h-11 pl-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Jelszó</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Legalább 8 karakter"
                className="h-11 pl-10"
              />
            </div>
          </div>
          <label
            htmlFor="gdpr"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
              gdpr
                ? "border-accent/60 bg-[#f0f4e5]"
                : "border-black/10 bg-white hover:border-black/20"
            }`}
          >
            <Checkbox
              id="gdpr"
              checked={gdpr}
              onCheckedChange={(v) => setGdpr(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm font-normal leading-relaxed text-foreground">
              Elfogadom az{" "}
              <Link
                href="/adatvedelem"
                target="_blank"
                className="font-medium underline decoration-accent decoration-2 underline-offset-2 hover:text-[#4d7c0f]"
              >
                adatkezelési tájékoztatót
              </Link>{" "}
              és a{" "}
              <Link
                href="/aszf"
                target="_blank"
                className="font-medium underline decoration-accent decoration-2 underline-offset-2 hover:text-[#4d7c0f]"
              >
                felhasználási feltételeket
              </Link>
              .
            </span>
          </label>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-[#0a0a0a] text-base font-semibold text-white transition-all hover:bg-accent hover:text-black hover:shadow-[0_10px_36px_rgba(163,230,53,0.45)]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Fiók létrehozása
          </Button>
        </form>

        <div className="mt-5">
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            VAGY GYORSAN
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton
            label="Folytatás Google-fiókkal"
            role={role === "brand" ? "brand" : "creator"}
            profileKind={isProfessional ? "professional" : "ugc"}
            creatorType={isCreator ? creatorType : "ugc"}
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            A neved, emailed (és profilképed) a Google-fiókodból töltjük ki — jelszó nélkül.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Van már fiókod?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2 hover:text-accent"
          >
            Jelentkezz be
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * A kreatív szakember kártya: az új generált képbe már bele van égetve a teljes
 * felirat ("Kreatív szakember vagyok / Videós, Fotós, Operatőr") és a nyíl is,
 * tehát semmilyen overlay nem kell — ugyanúgy mint a másik két kártya.
 */
function ProfessionalRoleCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Videóvágó, Fotós, Operatőr vagyok"
      className="group relative block w-full overflow-hidden rounded-3xl bg-white shadow-sm outline-none transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl focus-visible:-translate-y-2 focus-visible:shadow-2xl focus-visible:ring-2 focus-visible:ring-accent"
      style={{ aspectRatio: "788 / 565" }}
    >
      <Image
        src="/images/register-professional.webp?v=2"
        alt="Videóvágó, Fotós, Operatőr vagyok"
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) 100vw, 500px"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </button>
  );
}

function RoleCard({
  onClick,
  alt,
  image,
}: {
  onClick: () => void;
  alt: string;
  image: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={alt}
      className="group relative block w-full overflow-hidden rounded-3xl shadow-sm outline-none transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl focus-visible:-translate-y-2 focus-visible:shadow-2xl focus-visible:ring-2 focus-visible:ring-accent"
      style={{ aspectRatio: "788 / 565" }}
    >
      <Image
        src={`${image}?v=4`}
        alt={alt}
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) 100vw, 500px"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </button>
  );
}
