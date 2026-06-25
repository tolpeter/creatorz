"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { HAIR_COLORS, EYE_COLORS, MODEL_TYPES } from "@/lib/constants";
import { updateModelAttributes } from "@/app/actions/creator-profile";

export type ModelAttributesInitial = {
  heightCm?: number;
  weightKg?: number;
  hairColor?: string;
  eyeColor?: string;
  bodyArt?: string;
  modelTypes?: string[];
};

export function ModelAttributesCard({ initial }: { initial: ModelAttributesInitial }) {
  const [pending, start] = useTransition();
  const [height, setHeight] = useState(initial.heightCm != null ? String(initial.heightCm) : "");
  const [weight, setWeight] = useState(initial.weightKg != null ? String(initial.weightKg) : "");
  const [hairColor, setHairColor] = useState(initial.hairColor ?? "");
  const [eyeColor, setEyeColor] = useState(initial.eyeColor ?? "");
  const [bodyArt, setBodyArt] = useState(initial.bodyArt ?? "");
  const [modelTypes, setModelTypes] = useState<string[]>(initial.modelTypes ?? []);

  function save() {
    start(async () => {
      const res = await updateModelAttributes({
        heightCm: height ? Number(height) : null,
        weightKg: weight ? Number(weight) : null,
        hairColor,
        eyeColor,
        bodyArt,
        modelTypes,
      });
      if (res.error) toast.error(res.error);
      else toast.success("Modell-adatlap mentve");
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <Ruler className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold">Modell-adatlap</h2>
          <p className="text-xs text-muted-foreground">
            Ügynökségi paraméterek — a márkák ezek alapján is kereshetnek.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="m-height">Magasság (cm)</Label>
          <Input
            id="m-height"
            type="number"
            inputMode="numeric"
            min={50}
            max={250}
            value={height}
            placeholder="pl. 178"
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-weight">Súly (kg) — opcionális</Label>
          <Input
            id="m-weight"
            type="number"
            inputMode="numeric"
            min={20}
            max={300}
            value={weight}
            placeholder="pl. 62"
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Hajszín</Label>
          <Select value={hairColor} onValueChange={setHairColor}>
            <SelectTrigger>
              <SelectValue placeholder="Válassz…" />
            </SelectTrigger>
            <SelectContent>
              {HAIR_COLORS.map((h) => (
                <SelectItem key={h.value} value={h.value}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Szemszín</Label>
          <Select value={eyeColor} onValueChange={setEyeColor}>
            <SelectTrigger>
              <SelectValue placeholder="Válassz…" />
            </SelectTrigger>
            <SelectContent>
              {EYE_COLORS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label>Modell-típus</Label>
        <ChipMultiSelect compact options={MODEL_TYPES} value={modelTypes} onChange={setModelTypes} />
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="m-bodyart">Tetoválás / piercing</Label>
        <Textarea
          id="m-bodyart"
          rows={2}
          maxLength={300}
          value={bodyArt}
          placeholder="Van-e, és röviden hol / milyen. (Ha nincs, hagyd üresen vagy írd: nincs.)"
          onChange={(e) => setBodyArt(e.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
          disabled={pending}
          onClick={save}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Mentés
        </Button>
      </div>
    </div>
  );
}
