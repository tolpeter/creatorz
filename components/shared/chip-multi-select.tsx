"use client";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string; emoji?: string };

export function ChipMultiSelect({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly Option[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, v]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        const disabled = !active && !!max && value.length >= max;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background hover:bg-muted",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            {opt.emoji ? `${opt.emoji} ` : ""}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
