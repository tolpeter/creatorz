"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("A két jelszó nem egyezik");
      return;
    }
    setLoading(true);
    const res = await updatePasswordAction({ password });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("A jelszavad frissült. Most már beléphetsz az új jelszóval.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.14)] sm:p-8">
      <div className="mb-6">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
          <KeyRound className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-black">Új jelszó beállítása</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add meg az új jelszavadat. Legalább 8 karaktert használj.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Új jelszó</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-black text-base font-semibold text-white hover:bg-accent hover:text-black"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Jelszó frissítése
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Mégsem most?{" "}
        <Link href="/login" className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2">
          Vissza a bejelentkezéshez
        </Link>
      </p>
    </div>
  );
}
