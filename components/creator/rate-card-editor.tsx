"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RateCardItem = {
  service: string;
  priceHuf: number;
  description?: string;
};

export function RateCardEditor({
  value,
  onChange,
}: {
  value: RateCardItem[];
  onChange: (next: RateCardItem[]) => void;
}) {
  function update(i: number, patch: Partial<RateCardItem>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { service: "", priceHuf: 0, description: "" }]);
  }

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Még nincs szolgáltatás. Adj hozzá legalább egyet (pl. „30s UGC videó").
        </p>
      )}
      {value.map((row, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1.5">
              <Label>Szolgáltatás</Label>
              <Input
                value={row.service}
                onChange={(e) => update(i, { service: e.target.value })}
                placeholder="pl. 30s UGC videó"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ár (Ft)</Label>
              <Input
                type="number"
                min={0}
                value={Number.isFinite(row.priceHuf) ? row.priceHuf : 0}
                onChange={(e) => update(i, { priceHuf: Number(e.target.value) })}
                placeholder="25000"
              />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label>Leírás (opcionális)</Label>
            <Textarea
              value={row.description ?? ""}
              onChange={(e) => update(i, { description: e.target.value })}
              rows={2}
              placeholder="Mit tartalmaz a csomag?"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4" /> Törlés
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add}>
        <Plus className="h-4 w-4" /> Új szolgáltatás
      </Button>
    </div>
  );
}
