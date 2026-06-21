"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
// A hónap első napjának hétfő-alapú indexe (0 = hétfő … 6 = vasárnap).
function firstWeekdayMon(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

/**
 * Modern, naptáras születésnap-választó (popover). Gyors év-ugrás (a fejléc
 * címkéjére kattintva évrács nyílik). Az értéket ISO (YYYY-MM-DD) formában adja.
 */
export function DateOfBirthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const now = new Date();
  const maxYear = now.getFullYear() - 13;
  const minYear = now.getFullYear() - 100;

  const selected = value ? parseIso(value) : null;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "years">("days");
  const [view, setView] = useState(() =>
    selected
      ? { y: selected.y, m: selected.m - 1 }
      : { y: 2000, m: 0 },
  );

  function pick(day: number) {
    const iso = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      return { y: Math.min(maxYear, Math.max(minYear, y)), m };
    });
  }

  const lead = firstWeekdayMon(view.y, view.m);
  const total = daysInMonth(view.y, view.m);
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border bg-background px-3.5 text-sm transition-colors hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            {selected
              ? `${selected.y}. ${String(selected.m).padStart(2, "0")}. ${String(selected.d).padStart(2, "0")}.`
              : "Válaszd ki a dátumot"}
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[300px] rounded-2xl border bg-popover p-3 text-popover-foreground shadow-[0_16px_50px_rgba(0,0,0,0.18)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* Fejléc */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Előző hónap"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "days" ? "years" : "days"))}
              className="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              {MONTHS[view.m]} {view.y}
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Következő hónap"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {mode === "years" ? (
            <div className="grid max-h-[244px] grid-cols-4 gap-1.5 overflow-y-auto p-0.5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, y }));
                    setMode("days");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-black",
                    y === view.y && "bg-foreground text-background",
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-1">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                  const isSel =
                    day != null &&
                    selected &&
                    selected.y === view.y &&
                    selected.m === view.m + 1 &&
                    selected.d === day;
                  return day == null ? (
                    <div key={i} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pick(day)}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-accent hover:text-black",
                        isSel ? "bg-accent font-bold text-black" : "text-foreground",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function parseIso(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return { y, m, d };
}
