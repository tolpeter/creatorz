"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { CREATOR_CATEGORIES, CONTENT_TYPES, USAGE_RIGHTS } from "@/lib/constants";
import { createAd } from "@/app/actions/ads";

export function AdForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [contentType, setContentType] = useState("video");
  const [itemCount, setItemCount] = useState("1");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [usageRights, setUsageRights] = useState("organic");
  const [links, setLinks] = useState<string[]>([]);

  async function submit() {
    setLoading(true);
    const res = await createAd({
      title,
      description,
      categories,
      contentType: contentType as "video" | "photo" | "both",
      itemCount: Number(itemCount),
      budgetMinHuf: Number(budgetMin),
      budgetMaxHuf: Number(budgetMax),
      deadline: deadline as unknown as Date,
      location,
      usageRights: usageRights as "organic" | "paid_ads" | "perpetual",
      referenceLinks: links.filter((l) => l.trim()),
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Hirdetés beküldve moderálásra!");
    router.push(`/brand/ads/${res.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Új hirdetés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Cím *</Label>
          <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="pl. UGC videó keresése bőrápolási termékhez" />
          <p className="text-right text-xs text-muted-foreground">{title.length}/80</p>
        </div>
        <div className="space-y-1.5">
          <Label>Részletes leírás *</Label>
          <Textarea value={description} maxLength={2000} rows={5} onChange={(e) => setDescription(e.target.value)} placeholder="Mit vársz a creatortól? (min. 50 karakter)" />
          <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
        </div>
        <div className="space-y-2">
          <Label>Kategóriák (max 3) *</Label>
          <ChipMultiSelect options={CREATOR_CATEGORIES} value={categories} onChange={setCategories} max={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tartalom típusa</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Darabszám</Label>
            <Input type="number" min={1} max={20} value={itemCount} onChange={(e) => setItemCount(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Min. költségvetés (Ft) *</Label>
            <Input type="number" min={1000} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Max. költségvetés (Ft) *</Label>
            <Input type="number" min={1000} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Határidő *</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lokáció (opcionális)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="pl. Budapest vagy Online" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Felhasználási jog</Label>
          <Select value={usageRights} onValueChange={setUsageRights}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {USAGE_RIGHTS.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Referencia linkek (max 5)</Label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input value={l} onChange={(e) => setLinks(links.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder="https://…" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {links.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setLinks([...links, ""])}>
              <Plus className="h-4 w-4" /> Link hozzáadása
            </Button>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hirdetés beküldése
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
