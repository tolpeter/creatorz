"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { verifyMfaSignInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        toast.error("Nem sikerült betölteni a kétlépcsős azonosítást.");
        router.replace("/login");
        return;
      }
      const factor = data?.totp?.find((item) => item.status === "verified");
      if (!factor) {
        router.replace("/dashboard");
        return;
      }
      setFactorId(factor.id);
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setSubmitting(true);
    const res = await verifyMfaSignInAction({
      factorId,
      code,
      rememberMe: true,
    });
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Kétlépcsős azonosítás sikeres.");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.14)] sm:p-8">
      <div className="mb-6">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-black">Kétlépcsős azonosítás</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A fiókod védett. Add meg az authenticator alkalmazásban látható kódot.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Biztonsági állapot betöltése...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mfaCode">Azonosító kód</Label>
            <Input
              id="mfaCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="h-12 text-center text-xl tracking-[0.35em]"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="h-11 w-full bg-black text-base font-semibold text-white hover:bg-accent hover:text-black"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Belépés megerősítése
          </Button>
        </form>
      )}
    </div>
  );
}
