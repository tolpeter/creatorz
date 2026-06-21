"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];

function daysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

/**
 * Modern születésnap-választó: Év / Hónap / Nap legördülők. Praktikusabb, mint
 * a natív naptár (DOB-hoz évekig görgetni rossz UX), és illik a dizájnhoz.
 * Az értéket ISO formában (YYYY-MM-DD) adja/várja.
 */
export function DateOfBirthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const parse = (v: string) => {
    const [y, m, d] = (v || "").split("-");
    return {
      y: y ? Number(y) : undefined,
      m: m ? Number(m) : undefined,
      d: d ? Number(d) : undefined,
    };
  };
  const [parts, setParts] = useState(() => parse(value));

  // Külső érték-változás szinkronizálása (pl. betöltött kezdő dátum).
  useEffect(() => {
    setParts(parse(value));
  }, [value]);

  const now = new Date();
  const maxYear = now.getFullYear() - 13;
  const minYear = now.getFullYear() - 100;
  const years: number[] = [];
  for (let yy = maxYear; yy >= minYear; yy--) years.push(yy);

  const dayMax = parts.y && parts.m ? daysInMonth(parts.y, parts.m) : 31;
  const days = Array.from({ length: dayMax }, (_, i) => i + 1);

  function update(nextY?: number, nextM?: number, nextD?: number) {
    const np = { y: nextY, m: nextM, d: nextD };
    // Ha a nap túllóg az új hónapon, korrigáljuk.
    if (np.y && np.m && np.d) {
      np.d = Math.min(np.d, daysInMonth(np.y, np.m));
    }
    setParts(np);
    if (np.y && np.m && np.d) {
      onChange(
        `${np.y}-${String(np.m).padStart(2, "0")}-${String(np.d).padStart(2, "0")}`,
      );
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={parts.y ? String(parts.y) : undefined}
        onValueChange={(val) => update(Number(val), parts.m, parts.d)}
      >
        <SelectTrigger aria-label="Év">
          <SelectValue placeholder="Év" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {years.map((yy) => (
            <SelectItem key={yy} value={String(yy)}>
              {yy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts.m ? String(parts.m) : undefined}
        onValueChange={(val) => update(parts.y, Number(val), parts.d)}
      >
        <SelectTrigger aria-label="Hónap">
          <SelectValue placeholder="Hónap" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {MONTHS.map((name, i) => (
            <SelectItem key={name} value={String(i + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts.d ? String(parts.d) : undefined}
        onValueChange={(val) => update(parts.y, parts.m, Number(val))}
      >
        <SelectTrigger aria-label="Nap">
          <SelectValue placeholder="Nap" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {days.map((dd) => (
            <SelectItem key={dd} value={String(dd)}>
              {dd}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
