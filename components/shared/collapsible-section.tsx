"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Látványos, lenyitható szekció: fejléc-gomb (ikon, cím, darabszám, opcionális
 * "Kiemelt" jelölés, forgó chevron) + lenyíló tartalom. Sok elemnél (pl. sok
 * megtekintő / pályázó) kompakttá teszi az oldalt.
 */
export function CollapsibleSection({
  title,
  count,
  icon,
  badge,
  defaultOpen = false,
  accent = false,
  children,
}: {
  title: string;
  count?: number;
  icon?: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  accent?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-shadow",
        accent ? "border-accent/30 bg-[#f6f7f2]" : "border-black/10 bg-card",
        open && "shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors",
          accent ? "hover:bg-accent/10" : "hover:bg-black/[0.03]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[#3f6212]">
              {icon}
            </span>
          ) : null}
          <span className="truncate text-base font-bold">{title}</span>
          {typeof count === "number" ? (
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-[#3f6212]">
              {count}
            </span>
          ) : null}
          {badge ? (
            <span className="hidden shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3f6212] sm:inline">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="border-t border-black/[0.06] p-4">{children}</div> : null}
    </div>
  );
}
