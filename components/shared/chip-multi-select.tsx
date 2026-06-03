"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; emoji?: string };

export function ChipMultiSelect({
  options,
  value,
  onChange,
  max,
  compact = false,
  iconMap,
}: {
  options: readonly Option[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  compact?: boolean;
  iconMap?: Record<string, LucideIcon>;
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
    <div className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
      {options.map((opt) => {
        const active = value.includes(opt.value);
        const disabled = !active && !!max && value.length >= max;
        const Icon = iconMap?.[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center rounded-full border transition-colors",
              compact ? "gap-1.5 px-2.5 py-1 text-xs" : "gap-1.5 px-3 py-1.5 text-sm",
              active
                ? "border-accent bg-accent/15 text-foreground"
                : "border-border bg-background hover:bg-muted",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  active ? "text-accent" : "text-foreground/70",
                  compact ? "h-3.5 w-3.5" : "h-4 w-4"
                )}
                strokeWidth={1.8}
              />
            ) : opt.emoji ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full",
                  compact ? "h-3.5 w-3.5 text-[9px]" : "h-5 w-5 text-[11px]",
                  active ? "bg-accent" : "bg-muted"
                )}
              >
                {opt.emoji}
              </span>
            ) : null}
            <span className="font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
