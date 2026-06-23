"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/creator/image-uploader";
import { INDUSTRIES } from "@/lib/constants";
import { updateBrandProfile } from "@/app/actions/brand-profile";

export type BrandProfileInitial = {
  companyName: string;
  websiteUrl: string;
  logoUrl: string | null;
  contactName: string;
  contactPhone: string;
  industry: string;
  taxNumber: string;
  address: string;
  description: string;
};

export function BrandProfileEditor({ initial }: { initial: BrandProfileInitial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof BrandProfileInitial>(k: K, val: BrandProfileInitial[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function save() {
    if (v.companyName.trim().length < 2) {
      toast.error("Add meg a cégnevet");
      return;
    }
    setLoading(true);
    const res = await updateBrandProfile(v);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Mentve");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cégadatok</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader
            bucket="logos"
            variant="avatar"
            label="Logó"
            value={v.logoUrl}
            onChange={(url) => set("logoUrl", url)}
          />
          <div className="space-y-1.5">
            <Label>Cégnév *</Label>
            <Input value={v.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Weboldal</Label>
            <Input
              value={v.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kapcsolattartó</Label>
              <Input value={v.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={v.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Iparág</Label>
            <Select value={v.industry || undefined} onValueChange={(val) => set("industry", val)}>
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
            <Label>Bemutatkozás</Label>
            <Textarea
              value={v.description}
              rows={3}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Részletes adatok</CardTitle>
          <CardDescription>
            Csak akkor kötelező, ha kampányt szeretnél feladni (5. fázis).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Adószám</Label>
            <Input value={v.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Székhely</Label>
            <Input value={v.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Mentés
        </Button>
      </div>
    </div>
  );
}
