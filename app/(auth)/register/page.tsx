"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { Sparkles, Building2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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
      <div className="relative w-full max-w-5xl">
        {/* Lebegő blob háttér */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 animate-blob rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 animate-blob rounded-full bg-accent/10 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 animate-blob rounded-full bg-accent/12 blur-3xl"
          style={{ animationDelay: "8s" }}
        />

        <div className="relative space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Csatlakozz a Creatorz-hoz</h1>
            <p className="text-muted-foreground">
              Válaszd ki, hogyan szeretnél regisztrálni
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RoleCard
              onClick={() => chooseRole("creator")}
              icon={<Sparkles className="h-6 w-6 text-accent" />}
              iconBg="bg-accent/15"
              title="Tartalomgyártó vagyok"
              desc="Tartalmat gyártok és márkákkal szeretnék dolgozni"
              image="/images/register-creator.webp"
            />
            <RoleCard
              onClick={() => chooseRole("brand")}
              icon={<Building2 className="h-6 w-6 text-accent" />}
              iconBg="bg-accent/15"
              title="Márka vagyok"
              desc="Tartalomgyártókat keresek a tartalmaim elkészítéséhez"
              image="/images/register-brand.webp"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Van már fiókod?{" "}
            <Link href="/login" className="font-medium text-accent underline">
              Jelentkezz be
            </Link>
          </p>
        </div>
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

function RoleCard({
  onClick,
  icon,
  iconBg,
  title,
  desc,
  image,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  image: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-3xl border bg-card text-left shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-accent focus-visible:-translate-y-2 focus-visible:shadow-2xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:aspect-[4/5] md:aspect-[4/5]"
    >
      {/* SZÖVEG TOP */}
      <div className="relative z-10 flex flex-col gap-3 p-6 sm:p-7">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h2>
          <p className="mt-1.5 max-w-[14rem] text-sm text-muted-foreground">
            {desc}
          </p>
        </div>
      </div>

      {/* KÉP BOTTOM */}
      <div className="relative flex-1 overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 500px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Subtle gradient overlay alulra */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/70 to-transparent" />
      </div>

      {/* ARROW GOMB BOTTOM-LEFT */}
      <span className="absolute bottom-5 left-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card text-accent shadow-lg transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground group-hover:shadow-[0_0_24px_rgba(163,230,53,0.5)] group-hover:scale-110 sm:bottom-6 sm:left-6">
        <ArrowRight className="h-5 w-5" />
      </span>
    </button>
  );
}
