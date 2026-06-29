"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  signInAction,
  sendMagicLinkAction,
  sendPasswordResetAction,
  verifyMfaSignInAction,
} from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState("/dashboard");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signInAction({ email, password, rememberMe });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.mfaRequired && res.factorId) {
      setMfaFactorId(res.factorId);
      setPendingRedirect(res.redirectTo ?? "/dashboard");
      toast.info("Add meg az authenticator alkalmazás 6 jegyű kódját.");
      return;
    }
    toast.success("Sikeres bejelentkezés!");
    router.push(res.redirectTo ?? "/dashboard");
    router.refresh();
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setLoading(true);
    const res = await verifyMfaSignInAction({
      factorId: mfaFactorId,
      code: mfaCode,
      rememberMe,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Kétlépcsős azonosítás sikeres!");
    router.push(res.redirectTo ?? pendingRedirect);
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Add meg az email címed a magic linkhez");
      return;
    }
    setMagicLoading(true);
    const res = await sendMagicLinkAction({ email });
    setMagicLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Bejelentkezési linket küldtünk az emailedre!");
  }

  async function handlePasswordReset() {
    if (!email) {
      toast.error("Add meg az email címed a jelszó-visszaállításhoz");
      return;
    }
    setResetLoading(true);
    const res = await sendPasswordResetAction({ email });
    setResetLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Jelszó-visszaállító linket küldtünk az emailedre.");
  }

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] lg:grid-cols-2">
      {/* BAL: brandelt, animált vizuál panel */}
      <div className="relative hidden min-h-[600px] overflow-hidden bg-[#0a0a0a] lg:block">
        <Image
          src="/images/generated/login-hero.webp?v=2"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        {/* Sötét gradiens overlay az olvashatósághoz */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.35)_0%,rgba(10,10,10,0.6)_55%,rgba(10,10,10,0.96)_100%)]"
        />
        {/* Animált lime blobok */}
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
          style={{ animationDelay: "5s" }}
        />

        {/* Lebegő mini-chip */}
        <div
          aria-hidden
          className="animate-float absolute right-6 top-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/55 px-3 py-2 text-white backdrop-blur"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-black">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold">Hitelesített alkotók</span>
        </div>

        {/* Alsó szöveges blokk */}
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Magyar alkotói közösség
          </span>
          <h2 className="mt-4 text-balance text-3xl font-black leading-tight">
            Üdv újra a{" "}
            <span className="text-accent">Creatorz</span>-on!
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
            Lépj be, és folytasd ott, ahol abbahagytad — kampányok,
            együttműködések és üzenetek egy helyen.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {[
              "UGC tartalomgyártók, influencerek, modellek",
              "Közvetlen kapcsolat a márkákkal",
              "AI-frissített követőszámok",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* JOBB: bejelentkezési űrlap */}
      <div className="animate-slide-up flex flex-col justify-center p-7 sm:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black sm:text-3xl">Bejelentkezés</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Üdv újra! Lépj be a fiókodba.
          </p>
        </div>

        {mfaFactorId ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-black">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Kétlépcsős azonosítás</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Írd be az authenticator alkalmazásban látható 6 jegyű kódot.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mfaCode">Azonosító kód</Label>
              <Input
                id="mfaCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="h-12 text-center text-xl tracking-[0.35em]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="h-11 w-full bg-[#0a0a0a] text-base font-semibold text-white transition-all hover:bg-accent hover:text-black"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Belépés megerősítése
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMfaFactorId(null);
                setMfaCode("");
              }}
            >
              Vissza a jelszavas belépéshez
            </Button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-10"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              Bejelentkezve maradok
            </label>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="text-sm font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-4 hover:text-accent disabled:opacity-60"
            >
              {resetLoading ? "Küldés..." : "Elfelejtettem a jelszót"}
            </button>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-[#0a0a0a] text-base font-semibold text-white shadow-[0_10px_30px_rgba(163,230,53,0.0)] transition-all hover:bg-accent hover:text-black hover:shadow-[0_10px_36px_rgba(163,230,53,0.45)]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Bejelentkezés
          </Button>
        </form>
        )}

        {!mfaFactorId ? (
          <>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          VAGY
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full font-medium transition-colors hover:border-accent hover:bg-accent/5"
          onClick={handleMagicLink}
          disabled={magicLoading}
        >
          {magicLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-accent" />
          )}
          Magic link küldése
        </Button>
          </>
        ) : null}

        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f6f7f2] p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" />
            <p>
              A jelszó-visszaállításhoz add meg az email címed, majd kattints az
              emailben kapott biztonságos linkre.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Még nincs fiókod?{" "}
          <Link
            href="/register"
            className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2 hover:text-accent"
          >
            Regisztrálj
          </Link>
        </p>
      </div>
    </div>
  );
}
