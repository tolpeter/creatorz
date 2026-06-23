"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdForm } from "@/components/brand/ad-form";

/**
 * Admin kampány-létrehozó: előbb kiválasztja, melyik márka nevében, majd a
 * megszokott kampány-űrlappal feladja (rögtön aktív).
 */
export function AdminAdCreator({
  brands,
}: {
  brands: { id: string; name: string }[];
}) {
  const [brandId, setBrandId] = useState<string>("");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        <Label>Melyik márka nevében?</Label>
        <Select value={brandId || undefined} onValueChange={setBrandId}>
          <SelectTrigger className="mt-2 max-w-md">
            <SelectValue placeholder="Válassz márkát…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          A kampány ennek a márkának a nevében, rögtön <strong>aktív</strong> állapotban jön létre
          (nincs külön moderálás).
        </p>
      </div>

      {brandId ? (
        <AdForm adminBrandId={brandId} />
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Előbb válassz egy márkát a kampány kitöltéséhez.
        </p>
      )}
    </div>
  );
}
