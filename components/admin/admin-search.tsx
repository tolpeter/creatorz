import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Admin kereső + opcionális szűrő-chipek. A kereső sima GET-form (nincs
 * kliens-JS), Enterre a `?q=` paraméterrel tölti újra az oldalt. A chipek
 * linkek, amelyek megőrzik az aktuális keresőkifejezést.
 */
export function AdminSearch({
  placeholder = "Keresés…",
  q = "",
  basePath,
  filterParam,
  activeFilter = "",
  filters,
}: {
  placeholder?: string;
  q?: string;
  basePath?: string;
  filterParam?: string;
  activeFilter?: string;
  filters?: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label="Keresés"
          className="h-10 pl-9"
        />
        {activeFilter && filterParam && (
          <input type="hidden" name={filterParam} value={activeFilter} />
        )}
      </form>

      {filters && basePath && filterParam && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set(filterParam, f.value);
            const href = params.toString()
              ? `${basePath}?${params.toString()}`
              : basePath;
            const active = activeFilter === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={href}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                  (active
                    ? "border-accent bg-accent text-black"
                    : "border-black/10 bg-white text-muted-foreground hover:bg-muted")
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
