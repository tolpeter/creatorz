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

export function BrandOnboardingForm({
  initial,
}: {
  initial: { companyName: string; websiteUrl: string; contactName: string; industry: string };
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);
  const [contactName, setContactName] = useState(initial.contactName);
  const [industry, setIndustry] = useState(initial.industry);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (companyName.trim().length < 2) {
      toast.error("Add meg a cégnevet");
      return;
    }
    setLoading(true);
    const res = await completeBrandOnboarding({ companyName, websiteUrl, contactName, industry });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Profil elmentve!");
    router.push("/brand");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Márka profil beállítása</CardTitle>
        <CardDescription>
          Pár alapadat — a részletes adatok (adószám, székhely) csak
          hirdetésfeladáskor kellenek.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Cégnév *</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
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
          <Label>Kapcsolattartó neve (opcionális)</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Iparág (opcionális)</Label>
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
