"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Database,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { ExportButton } from "@/components/admin/export-button";

const ICONS: Record<string, typeof Database> = {
  ugc: UserCheck,
  pro: Sparkles,
  brand: Building2,
};

/**
 * Admin adatbázis-szekció: összecsukható (alapból csukva) törzs, benne
 * minden mezőre szűrhető lista + teljes CSV-letöltés. A szűrés a betöltött
 * előnézeten fut (kliens-oldal); a teljes adat a CSV-ben.
 */
export function DatabaseSection({
  title,
  iconKey,
  count,
  exportType,
  columns,
  rows,
  previewLimit,
}: {
  title: string;
  iconKey: "ugc" | "pro" | "brand";
  count: number;
  exportType: "creators-ugc" | "creators-pro" | "brands";
  columns: string[];
  rows: string[][];
  previewLimit: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const Icon = ICONS[iconKey] ?? Database;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.some((c) => c.toLowerCase().includes(term)));
  }, [q, rows]);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-[#3f6212]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{count} rekord összesen</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {open ? "Összecsukás" : "Megnyitás"}
        </span>
      </button>

      {open && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Szűrés bármely mezőre…"
                className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <ExportButton type={exportType} label="Teljes CSV letöltése" />
          </div>

          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {q.trim() ? "Nincs a szűrésnek megfelelő rekord." : "Nincs adat."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      {r.map((cellValue, j) => (
                        <td key={j} className="whitespace-nowrap px-3 py-2">
                          {cellValue.length > 40 ? `${cellValue.slice(0, 40)}…` : cellValue}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            {rows.length >= previewLimit
              ? `A lista az első ${previewLimit} rekordot mutatja (a szűrés ezen fut) — a teljes adat a CSV-ben.`
              : `${filtered.length} / ${rows.length} rekord látszik.`}
          </p>
        </>
      )}
    </section>
  );
}
