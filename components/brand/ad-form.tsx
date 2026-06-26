"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Loader2, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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
import { createAd, updateAd, adminCreateAd } from "@/app/actions/ads";

// "Kit keresel?" opciók — UGC creator / influenszer / modell + kreatív szakember típusok
const TARGET_KIND_OPTIONS = [
  { value: "ugc", label: "UGC tartalomgyártó" },
  { value: "influencer", label: "Influenszer" },
  { value: "model", label: "Modell" },
  { value: "editor", label: "Videóvágó" },
  { value: "photographer", label: "Fotós" },
  { value: "videographer", label: "Operatőr" },
] as const;

export type AdFormInitial = {
  title: string;
  description: string;
  categories: string[];
  targetKinds: string[];
  contentType: string;
  collaborationType: string;
  coverUrl: string | null;
  budgetMin: string;
  budgetMax: string;
  budgetPublic: boolean;
  anonymous: boolean;
  seekingCount: string | null;
  deadline: string;
  location: string;
  usageRights: string;
  links: string[];
};

export function AdForm({
  adId,
  initial,
  adminBrandId,
  adminEdit = false,
}: {
  adId?: string;
  initial?: AdFormInitial;
  /** Admin mód: a kampány ennek a márkának a nevében jön létre. */
  adminBrandId?: string;
  /** Admin szerkeszti egy meglévő kampányt → vissza az admin listára. */
  adminEdit?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(adId);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [targetKinds, setTargetKinds] = useState<string[]>(initial?.targetKinds ?? ["ugc"]);
  const [contentType, setContentType] = useState(initial?.contentType ?? "video");
  const [collaborationType, setCollaborationType] = useState(
    initial?.collaborationType ?? "project",
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin ?? "");
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax ?? "");
  const [budgetPublic, setBudgetPublic] = useState(initial?.budgetPublic ?? false);
  const [anonymous, setAnonymous] = useState(initial?.anonymous ?? false);
  // "none" = nem adom meg (nem jelenik meg a kampányban)
  const [seekingCount, setSeekingCount] = useState(initial?.seekingCount ?? "none");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [usageRights, setUsageRights] = useState(initial?.usageRights ?? "organic");
  const [links, setLinks] = useState<string[]>(initial?.links ?? []);

  async function submit() {
    setLoading(true);
    const payload = {
      title,
      description,
      categories,
      targetKinds: targetKinds as ("ugc" | "influencer" | "model" | "editor" | "photographer" | "videographer")[],
      contentType: contentType as "video" | "photo" | "both",
      collaborationType: collaborationType as "project" | "longterm" | "barter",
      coverUrl,
      budgetMinHuf: budgetMin ? Number(budgetMin) : "",
      budgetMaxHuf: budgetMax ? Number(budgetMax) : "",
      budgetPublic,
      anonymous,
      seekingCount:
        seekingCount === "none" ? null : (seekingCount as "one" | "multiple"),
      deadline: deadline as unknown as Date,
      location,
      usageRights: usageRights as "organic" | "paid_ads" | "perpetual",
      referenceLinks: links.filter((l) => l.trim()),
    };
    const res = isEdit
      ? await updateAd(adId!, payload)
      : adminBrandId
        ? await adminCreateAd(adminBrandId, payload)
        : await createAd(payload);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      isEdit
        ? "Kampány módosítva!"
        : adminBrandId
          ? "Kampány létrehozva (aktív)!"
          : "Kampány beküldve moderálásra!",
    );
    router.push(adminBrandId || adminEdit ? "/admin/ads" : `/brand/ads/${res.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Kampány szerkesztése" : "Új kampány"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Borítókép (opcionális)</Label>
          <p className="text-xs text-muted-foreground">
            Egy figyelemfelkeltő kép a kampányod tetejére és a listában.
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
            Több típust is megjelölhetsz — a megfelelő alkotók látják a kampányt.
          </p>
          <ChipMultiSelect
            options={TARGET_KIND_OPTIONS}
            value={targetKinds}
            onChange={(next) => setTargetKinds(next.length ? next : ["ugc"])}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            Hány alkotót keresel?
          </Label>
          <Select value={seekingCount} onValueChange={setSeekingCount}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nem adom meg (nem jelenik meg)</SelectItem>
              <SelectItem value="one">1 alkotót keresek</SelectItem>
              <SelectItem value="multiple">Több alkotót keresek</SelectItem>
            </SelectContent>
          </Select>
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
            <NumberInput
              value={budgetMin}
              onChange={setBudgetMin}
              placeholder="Min. (pl. 30 000)"
            />
            <NumberInput
              value={budgetMax}
              onChange={setBudgetMax}
              placeholder="Max. (pl. 80 000)"
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
                Ha nincs bepipálva, a kampányon „Megegyezés szerint" jelenik meg,
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
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-accent bg-accent/15 p-3.5 shadow-[0_2px_14px_rgba(163,230,53,0.25)] transition-colors hover:bg-accent/20">
          <Checkbox
            checked={anonymous}
            onCheckedChange={(v) => setAnonymous(v === true)}
            className="mt-0.5 h-5 w-5 border-2 border-[#3f6212] data-[state=checked]:bg-[#3f6212] data-[state=checked]:text-white"
          />
          <span className="text-sm leading-snug">
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-[#2a3d09]">
              <EyeOff className="h-4 w-4" />
              Anonim kampány
            </span>
            <span className="mt-0.5 block text-xs text-[#3f6212]/90">
              A publikus kampányban NEM jelenik meg a cégnév, logó, weboldal.
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
            {isEdit ? "Mentés" : "Kampány beküldése"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
