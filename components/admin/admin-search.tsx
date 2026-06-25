import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type FilterDef = { label: string; value: string };

/**
 * Admin kereső + 1-2 szűrő-sor (chipek). A kereső sima GET-form (nincs
 * kliens-JS). A chipek linkek, amelyek megőrzik a keresőkifejezést ÉS a másik
 * szűrő-sor aktív értékét — így a két szűrő-dimenzió együtt működik.
 */
export function AdminSearch({
  placeholder = "Keresés…",
  q = "",
  basePath,
  filterParam,
  activeFilter = "",
  filters,
  // Opcionális második szűrő-sor (pl. típus a státusz mellett):
  filterParam2,
  activeFilter2 = "",
  filters2,
}: {
  placeholder?: string;
  q?: string;
  basePath?: string;
  filterParam?: string;
  activeFilter?: string;
  filters?: FilterDef[];
  filterParam2?: string;
  activeFilter2?: string;
  filters2?: FilterDef[];
}) {
  function chipHref(param: string, value: string, keepParam?: string, keepValue?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (keepParam && keepValue) params.set(keepParam, keepValue);
    if (value) params.set(param, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath!;
  }

  function Row({
    param,
    active,
    defs,
    keepParam,
    keepValue,
  }: {
    param: string;
    active: string;
    defs: FilterDef[];
    keepParam?: string;
    keepValue?: string;
  }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {defs.map((f) => {
          const isActive = active === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={chipHref(param, f.value, keepParam, keepValue)}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                (isActive
                  ? "border-accent bg-accent text-black"
                  : "border-black/10 bg-white text-muted-foreground hover:bg-muted")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          {activeFilter2 && filterParam2 && (
            <input type="hidden" name={filterParam2} value={activeFilter2} />
          )}
        </form>

        {filters && basePath && filterParam && (
          <Row
            param={filterParam}
            active={activeFilter}
            defs={filters}
            keepParam={filterParam2}
            keepValue={activeFilter2}
          />
        )}
      </div>

      {filters2 && basePath && filterParam2 && (
        <Row
          param={filterParam2}
          active={activeFilter2}
          defs={filters2}
          keepParam={filterParam}
          keepValue={activeFilter}
        />
      )}
    </div>
  );
}
