"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type VerifiedFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
};

export function SecuritySettingsCard() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [factor, setFactor] = useState<VerifiedFactor | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    void refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatus() {
    setLoading(true);
    const [{ data: factors }, { data: aal }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setFactor((factors?.totp?.find((item) => item.status === "verified") as VerifiedFactor | undefined) ?? null);
    setCurrentLevel(aal?.currentLevel ?? null);
    setLoading(false);
  }

  async function startEnrollment() {
    setWorking(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Creatorz",
    });
    setWorking(false);

    if (error || !data || data.type !== "totp") {
      toast.error("Nem sikerült elindítani a kétlépcsős azonosítást.");
      return;
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setCode("");
  }

  async function verifyEnrollment() {
    if (!enrollment || code.length !== 6) return;
    setWorking(true);
    const challenge = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    });
    if (challenge.error || !challenge.data) {
      setWorking(false);
      toast.error("Nem sikerült ellenőrizni a kódot.");
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code,
    });
    setWorking(false);

    if (error) {
      toast.error("Hibás kód. Ellenőrizd az authenticator alkalmazást.");
      return;
    }

    toast.success("A kétlépcsős azonosítás bekapcsolva.");
    setEnrollment(null);
    setCode("");
    await refreshStatus();
  }

  async function disableMfa() {
    if (!factor) return;
    setWorking(true);

    if (currentLevel !== "aal2") {
      if (disableCode.length !== 6) {
        setWorking(false);
        toast.error("A kikapcsoláshoz add meg a 6 jegyű authenticator kódot.");
        return;
      }
      const verify = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: disableCode,
      });
      if (verify.error) {
        setWorking(false);
        toast.error("Hibás authenticator kód.");
        return;
      }
    }

    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setWorking(false);
    if (error) {
      toast.error("Nem sikerült kikapcsolni a kétlépcsős azonosítást.");
      return;
    }

    toast.success("A kétlépcsős azonosítás kikapcsolva.");
    setDisableCode("");
    await refreshStatus();
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-black">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Biztonság</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kapcsold be a kétlépcsős azonosítást authenticator alkalmazással.
              Belépéskor a jelszó után egy 6 jegyű kódot is kérünk.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#f0f2e8] px-3 py-1 text-xs font-semibold text-[#4d7c0f]">
          {loading ? "Ellenőrzés..." : factor ? "2FA aktív" : "2FA kikapcsolva"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Biztonsági állapot betöltése...
        </div>
      ) : factor ? (
        <div className="mt-5 space-y-4 rounded-2xl bg-[#f6f7f2] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#65a30d]" />
            <div>
              <p className="font-semibold">Kétlépcsős azonosítás bekapcsolva</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aktív faktor: {factor.friendly_name || "Authenticator app"}
              </p>
            </div>
          </div>

          {currentLevel !== "aal2" ? (
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="disableMfaCode">Kód a kikapcsoláshoz</Label>
              <Input
                id="disableMfaCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
              />
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={disableMfa}
            disabled={working}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            Kétlépcsős azonosítás kikapcsolása
          </Button>
        </div>
      ) : enrollment ? (
        <div className="mt-5 grid gap-5 rounded-2xl bg-[#f6f7f2] p-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollment.qrCode} alt="2FA QR kód" className="h-auto w-full" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Olvasd be a QR-kódot</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Használhatsz Google Authenticator, 1Password, Authy vagy más TOTP
                kompatibilis alkalmazást.
              </p>
              <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 text-xs text-muted-foreground">
                Titkos kulcs: {enrollment.secret}
              </p>
            </div>
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="mfaSetupCode">2. Írd be a 6 jegyű kódot</Label>
              <Input
                id="mfaSetupCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={verifyEnrollment} disabled={working || code.length !== 6}>
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                2FA aktiválása
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEnrollment(null);
                  setCode("");
                }}
              >
                Mégsem
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#f6f7f2] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#65a30d]" />
            <p className="text-sm leading-6 text-muted-foreground">
              Javasolt minden admin, márka és creator fióknál bekapcsolni.
            </p>
          </div>
          <Button type="button" onClick={startEnrollment} disabled={working}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            2FA bekapcsolása
          </Button>
        </div>
      )}
    </section>
  );
}
