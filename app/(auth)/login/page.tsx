"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInAction, sendMagicLinkAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signInAction({ email, password });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Sikeres bejelentkezés!");
    router.push(res.redirectTo ?? "/dashboard");
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Bejelentkezés</CardTitle>
        <CardDescription>Üdv újra! Lépj be a fiókodba.</CardDescription>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Bejelentkezés
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          VAGY
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMagicLink}
          disabled={magicLoading}
        >
          {magicLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Magic link küldése
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Még nincs fiókod?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline"
          >
            Regisztrálj
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
