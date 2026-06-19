"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/** Csak számjegyek, ezres tagolással (magyar, szóközzel): 1234567 -> "1 234 567". */
function group(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Szám-beviteli mező, ami GÉPELÉS közben ezres tagolással jeleníti meg a számot,
 * de a `value`/`onChange` mindig a NYERS számjegy-string (tagolás nélkül).
 * Egy sorban marad, a kurzor a helyén marad gépelés közben.
 */
export function NumberInput({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (raw: string) => void;
}) {
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = el.value.slice(0, caret).replace(/\D/g, "").length;
    const raw = el.value.replace(/\D/g, "");
    onChange(raw);

    // Kurzor visszaállítása ugyanannyi számjegy után a tagolt szövegben.
    requestAnimationFrame(() => {
      const formatted = group(raw);
      let pos = 0;
      let seen = 0;
      while (pos < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[pos]!)) seen++;
        pos++;
      }
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // egyes input típusoknál nem támogatott — figyelmen kívül hagyjuk
      }
    });
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={group(value)}
      onChange={handle}
    />
  );
}
