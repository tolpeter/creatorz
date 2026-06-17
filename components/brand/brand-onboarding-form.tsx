"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/constants";
import { completeBrandOnboarding } from "@/app/actions/brand-profile";
import { triggerVerificationEmail } from "@/app/actions/auth";

export function BrandOnboardingForm({
  initial,
}: {
  initial: {
    companyName: string;
    websiteUrl: string;
    contactName: string;
    industry: string;
    address: string;
  };
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);
  const [contactName, setContactName] = useState(initial.contactName);
  const [industry, setIndustry] = useState(initial.industry);
  const [address, setAddress] = useState(initial.address);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (companyName.trim().length < 2) {
      toast.error("Add meg a cég / vállalkozás nevét");
      return;
    }
    if (contactName.trim().length < 2) {
      toast.error("Add meg a kapcsolattartó nevét");
      return;
    }
    if (!industry) {
      toast.error("Válassz iparágat");
      return;
    }
    setLoading(true);
    let res: { error?: string; success?: boolean };
    try {
      res = await completeBrandOnboarding({
        companyName,
        websiteUrl,
        contactName,
        industry,
        address,
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
    // Email-megerősítés kiküldése (a hibája nem akadályozza az átirányítást).
    try {
      await triggerVerificationEmail();
    } catch {
      // ignoráljuk
    }
    // Átirányítás a dashboardra — onnan látja a következő lépést.
    window.location.href = "/dashboard";
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Márka profil beállítása</CardTitle>
        <CardDescription>
          Pár alapadat a kezdéshez. Adószám és egyéb részletek nem szükségesek.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Cégnév / vállalkozás neve *</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Kapcsolattartó neve *</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Iparág *</Label>
          <Select value={industry || undefined} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Válassz" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Weboldal (opcionális)</Label>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Székhely (opcionális)</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="pl. 1011 Budapest, Fő utca 1."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Mentés
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
