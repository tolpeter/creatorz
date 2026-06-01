"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Building2, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUpAction } from "@/app/actions/auth";

type Role = "creator" | "brand";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  function chooseRole(r: Role) {
    setRole(r);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const res = await signUpAction({ role, email, password, gdpr });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.needsConfirmation) {
      setConfirmSent(true);
      toast.success("Megerősítő emailt küldtünk!");
      return;
    }
    toast.success("Sikeres regisztráció!");
    router.push(res.redirectTo ?? "/dashboard");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ellenőrizd az email fiókod</CardTitle>
          <CardDescription>
            Küldtünk egy megerősítő linket a(z) <strong>{email}</strong> címre.
            Kattints rá a regisztráció befejezéséhez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Vissza a bejelentkezéshez</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Csatlakozz a Creatorz-hoz</h1>
          <p className="text-muted-foreground">
            Válaszd ki, hogyan szeretnél regisztrálni
          </p>
        </div>
        <div className="grid gap-4">
          <button
            type="button"
            onClick={() => chooseRole("creator")}
            className="group flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="rounded-lg bg-accent/15 p-3 text-accent-foreground">
              <Sparkles className="h-6 w-6 text-accent" />
            </span>
            <span>
              <span className="block text-lg font-semibold">Tartalomgyártó vagyok</span>
              <span className="block text-sm text-muted-foreground">
                Tartalmat gyártok és márkákkal szeretnék dolgozni
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => chooseRole("brand")}
            className="group flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="rounded-lg bg-secondary p-3">
              <Building2 className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold">Márka vagyok</span>
              <span className="block text-sm text-muted-foreground">
                Tartalomgyártókat keresek a tartalmaim elkészítéséhez
              </span>
            </span>
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Van már fiókod?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Jelentkezz be
          </Link>
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mb-2 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Vissza
        </button>
        <CardTitle>
          {role === "creator" ? "Tartalomgyártó regisztráció" : "Márka regisztráció"}
        </CardTitle>
        <CardDescription>Add meg az adataidat a fiók létrehozásához</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email cím</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="te@pelda.hu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Jelszó</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Legalább 8 karakter"
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="gdpr"
              checked={gdpr}
              onCheckedChange={(v) => setGdpr(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="gdpr" className="text-sm font-normal leading-snug">
              Elfogadom az{" "}
              <Link href="/about" className="underline">
                adatkezelési tájékoztatót
              </Link>{" "}
              és az ÁSZF-et.
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Fiók létrehozása
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
