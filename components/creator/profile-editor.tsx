"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { ImageUploader } from "@/components/creator/image-uploader";
import { RateCardEditor, type RateCardItem } from "@/components/creator/rate-card-editor";
import {
  CREATOR_CATEGORIES,
  HUNGARIAN_COUNTIES,
  LANGUAGES,
  GENDER_OPTIONS,
  BIO_MAX_LENGTH,
  MAX_CREATOR_CATEGORIES,
} from "@/lib/constants";
import { generateUsername } from "@/lib/utils/slug";
import {
  updateCreatorBasics,
  updateCreatorAppearance,
  updateCreatorEquipment,
  updateCreatorSocial,
  updateCreatorRateCard,
} from "@/app/actions/creator-profile";

export type ProfileEditorInitial = {
  username: string;
  displayName: string;
  bio: string;
  city: string;
  county: string;
  age: string;
  gender: string;
  categories: string[];
  languages: string[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  equipment: { phone: string; camera: string; microphone: string; editing: string };
  instagramUrl: string;
  instagramFollowers: string;
  tiktokUrl: string;
  tiktokFollowers: string;
  facebookUrl: string;
  facebookFollowers: string;
  youtubeUrl: string;
  youtubeSubscribers: string;
  rateCard: RateCardItem[];
};

type ActionResult = { success?: boolean; error?: string };

export function ProfileEditor({ initial }: { initial: ProfileEditorInitial }) {
  const router = useRouter();
  const [v, setV] = useState<ProfileEditorInitial>(initial);
  const [saving, setSaving] = useState<string | null>(null);

  function set<K extends keyof ProfileEditorInitial>(k: K, val: ProfileEditorInitial[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function run(tab: string, fn: () => Promise<ActionResult>) {
    setSaving(tab);
    const res = await fn();
    setSaving(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Mentve");
    router.refresh();
  }

  return (
    <Tabs defaultValue="basics" className="w-full">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="basics">Alapadatok</TabsTrigger>
        <TabsTrigger value="appearance">Megjelenés</TabsTrigger>
        <TabsTrigger value="equipment">Eszközök</TabsTrigger>
        <TabsTrigger value="social">Social fiókok</TabsTrigger>
        <TabsTrigger value="ratecard">Rate card</TabsTrigger>
      </TabsList>

      {/* ALAPADATOK */}
      <TabsContent value="basics">
        <Card>
          <CardHeader>
            <CardTitle>Alapadatok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Megjelenített név</Label>
              <Input
                value={v.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Felhasználónév</Label>
              <Input
                value={v.username}
                onChange={(e) => set("username", generateUsername(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bemutatkozás</Label>
              <Textarea
                value={v.bio}
                maxLength={BIO_MAX_LENGTH}
                rows={4}
                onChange={(e) => set("bio", e.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">
                {v.bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Város</Label>
                <Input value={v.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Megye</Label>
                <Select value={v.county || undefined} onValueChange={(val) => set("county", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz megyét" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUNGARIAN_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kor</Label>
                <Input
                  type="number"
                  min={13}
                  max={100}
                  value={v.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nem</Label>
                <Select value={v.gender || undefined} onValueChange={(val) => set("gender", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategóriák (max {MAX_CREATOR_CATEGORIES})</Label>
              <ChipMultiSelect
                options={CREATOR_CATEGORIES}
                value={v.categories}
                onChange={(n) => set("categories", n)}
                max={MAX_CREATOR_CATEGORIES}
              />
            </div>
            <div className="space-y-2">
              <Label>Nyelvek</Label>
              <ChipMultiSelect
                options={LANGUAGES}
                value={v.languages}
                onChange={(n) => set("languages", n)}
              />
            </div>
            <SaveButton
              loading={saving === "basics"}
              onClick={() =>
                run("basics", () =>
                  updateCreatorBasics({
                    username: v.username,
                    displayName: v.displayName,
                    bio: v.bio,
                    city: v.city,
                    county: v.county,
                    age: v.age ? Number(v.age) : null,
                    gender: v.gender,
                    categories: v.categories,
                    languages: v.languages,
                  })
                )
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* MEGJELENÉS */}
      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Megjelenés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUploader
              bucket="avatars"
              variant="avatar"
              label="Profilkép"
              value={v.avatarUrl}
              onChange={(url) => set("avatarUrl", url)}
            />
            <ImageUploader
              bucket="banners"
              variant="banner"
              label="Borítókép"
              value={v.bannerUrl}
              onChange={(url) => set("bannerUrl", url)}
            />
            <SaveButton
              loading={saving === "appearance"}
              onClick={() =>
                run("appearance", () =>
                  updateCreatorAppearance({
                    avatarUrl: v.avatarUrl,
                    bannerUrl: v.bannerUrl,
                  })
                )
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ESZKÖZÖK */}
      <TabsContent value="equipment">
        <Card>
          <CardHeader>
            <CardTitle>Eszközök</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["phone", "Telefon"],
                ["camera", "Kamera"],
                ["microphone", "Mikrofon"],
                ["editing", "Vágószoftver"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={v.equipment[key]}
                  onChange={(e) =>
                    set("equipment", { ...v.equipment, [key]: e.target.value })
                  }
                  placeholder={`pl. ${label} típusa`}
                />
              </div>
            ))}
            <SaveButton
              loading={saving === "equipment"}
              onClick={() =>
                run("equipment", () => updateCreatorEquipment(v.equipment))
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* SOCIAL */}
      <TabsContent value="social">
        <Card>
          <CardHeader>
            <CardTitle>Social fiókok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["instagramUrl", "instagramFollowers", "Instagram", "követő"],
                ["tiktokUrl", "tiktokFollowers", "TikTok", "követő"],
                ["facebookUrl", "facebookFollowers", "Facebook", "követő"],
                ["youtubeUrl", "youtubeSubscribers", "YouTube", "feliratkozó"],
              ] as const
            ).map(([urlKey, followKey, label, unit]) => (
              <div key={label} className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <div className="space-y-1.5">
                  <Label>{label} URL</Label>
                  <Input
                    value={v[urlKey]}
                    onChange={(e) => set(urlKey, e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{unit}szám</Label>
                  <Input
                    type="number"
                    min={0}
                    value={v[followKey]}
                    onChange={(e) => set(followKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
            <SaveButton
              loading={saving === "social"}
              onClick={() =>
                run("social", () =>
                  updateCreatorSocial({
                    instagramUrl: v.instagramUrl,
                    instagramFollowers: v.instagramFollowers ? Number(v.instagramFollowers) : null,
                    tiktokUrl: v.tiktokUrl,
                    tiktokFollowers: v.tiktokFollowers ? Number(v.tiktokFollowers) : null,
                    facebookUrl: v.facebookUrl,
                    facebookFollowers: v.facebookFollowers ? Number(v.facebookFollowers) : null,
                    youtubeUrl: v.youtubeUrl,
                    youtubeSubscribers: v.youtubeSubscribers ? Number(v.youtubeSubscribers) : null,
                  })
                )
              }
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* RATE CARD */}
      <TabsContent value="ratecard">
        <Card>
          <CardHeader>
            <CardTitle>Rate card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateCardEditor value={v.rateCard} onChange={(n) => set("rateCard", n)} />
            <SaveButton
              loading={saving === "ratecard"}
              onClick={() =>
                run("ratecard", () => updateCreatorRateCard({ rateCard: v.rateCard }))
              }
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button type="button" onClick={onClick} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Mentés
      </Button>
    </div>
  );
}
