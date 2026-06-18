"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/creator/image-uploader";
import {
  CREATOR_CATEGORIES,
  CONTENT_TYPES,
  USAGE_RIGHTS,
  COLLABORATION_TYPES,
} from "@/lib/constants";
import { createAd } from "@/app/actions/ads";

// "Kit keresel?" opciók — UGC creator + kreatív szakember típusok
const TARGET_KIND_OPTIONS = [
  { value: "ugc", label: "UGC tartalomgyártó" },
  { value: "editor", label: "Videóvágó" },
  { value: "photographer", label: "Fotós" },
  { value: "videographer", label: "Operatőr" },
] as const;

export function AdForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [targetKinds, setTargetKinds] = useState<string[]>(["ugc"]);
  const [contentType, setContentType] = useState("video");
  const [collaborationType, setCollaborationType] = useState("project");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [budgetPublic, setBudgetPublic] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
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
      targetKinds: targetKinds as ("ugc" | "editor" | "photographer" | "videographer")[],
      contentType: contentType as "video" | "photo" | "both",
      collaborationType: collaborationType as "project" | "longterm" | "barter",
      coverUrl,
      budgetMinHuf: budgetMin ? Number(budgetMin) : "",
      budgetMaxHuf: budgetMax ? Number(budgetMax) : "",
      budgetPublic,
      anonymous,
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
          <Label>Borítókép (opcionális)</Label>
          <p className="text-xs text-muted-foreground">
            Egy figyelemfelkeltő kép a hirdetésed tetejére és a listában.
          </p>
          <ImageUploader
            bucket="banners"
            variant="banner"
            label=""
            value={coverUrl}
            onChange={setCoverUrl}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cím *</Label>
          <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="pl. UGC videó keresése bőrápolási termékhez" />
          <p className="text-right text-xs text-muted-foreground">{title.length}/80</p>
        </div>
        <div className="space-y-1.5">
          <Label>Részletes leírás *</Label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            maxLength={2000}
            rows={6}
            placeholder="Mit vársz a creatortól? (min. 50 karakter) — a gombokkal félkövér, dőlt, címsor és lista is formázható."
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
        </div>
        <div className="space-y-2">
          <Label>Kit keresel? *</Label>
          <p className="text-xs text-muted-foreground">
            Több típust is megjelölhetsz — a megfelelő alkotók látják a hirdetést.
          </p>
          <ChipMultiSelect
            options={TARGET_KIND_OPTIONS}
            value={targetKinds}
            onChange={(next) => setTargetKinds(next.length ? next : ["ugc"])}
          />
        </div>
        <div className="space-y-2">
          <Label>Kategóriák (max 3) *</Label>
          <ChipMultiSelect options={CREATOR_CATEGORIES} value={categories} onChange={setCategories} max={3} />
        </div>
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
          <Label>Együttműködés típusa</Label>
          <Select value={collaborationType} onValueChange={setCollaborationType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLLABORATION_TYPES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label} — {c.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Bérezés (Ft) — opcionális</Label>
          <p className="text-xs text-muted-foreground">
            Alapból nem jelenik meg, a díjazás megbeszélés kérdése. Akkor töltsd
            ki, ha szeretnéd, hogy a tartalomgyártók lássák a keretet.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              min={1000}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="Min. (pl. 30000)"
            />
            <Input
              type="number"
              min={1000}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Max. (pl. 80000)"
            />
          </div>
          <label className="mt-2 flex items-start gap-2 rounded-lg bg-muted/60 p-3">
            <Checkbox
              checked={budgetPublic}
              onCheckedChange={(v) => setBudgetPublic(v === true)}
              className="mt-0.5"
              disabled={!budgetMin && !budgetMax}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium">A bérezés legyen publikus</span>
              <span className="block text-xs text-muted-foreground">
                Ha nincs bepipálva, a hirdetésen „Megegyezés szerint" jelenik meg,
                és a díjazást személyesen egyeztetitek.
              </span>
            </span>
          </label>
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
        <label className="flex items-start gap-2 rounded-lg border border-accent/30 bg-[#f0f4e5] p-3">
          <Checkbox
            checked={anonymous}
            onCheckedChange={(v) => setAnonymous(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug">
            <span className="font-medium text-[#3f6212]">Anonim hirdetés</span>
            <span className="block text-xs text-muted-foreground">
              A publikus hirdetésben NEM jelenik meg a cégnév, logó, weboldal.
              A részleteket csak az érdeklődő tartalomgyártókkal osztod meg az
              üzenetekben. (Az admin és a moderáció természetesen látja.)
            </span>
          </span>
        </label>
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
