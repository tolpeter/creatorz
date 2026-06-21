import Link from "next/link";
import { ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { MembersOnlyGate } from "@/components/layout/members-only-gate";
import {
  loadMoreCreators,
  countCreators,
  type BrowseFiltersInput,
} from "@/app/actions/browse";
import { BrowseFilters } from "@/components/creator/browse-filters";
import { SortSelect } from "@/components/creator/sort-select";
import { CreatorsInfiniteGrid } from "@/components/creator/creators-infinite-grid";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIRECTORY_TYPES } from "@/lib/constants";

export const metadata = {
  title: "Tartalomgyártók böngészése",
  description: "Találd meg a tökéletes magyar UGC tartalomgyártót a márkádhoz.",
};

type SP = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreatorsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const tipus = one(sp.tipus) ?? "all";
  const filters: BrowseFiltersInput = {
    tipus,
    search: one(sp.search),
    categories: one(sp.categories)?.split(",").filter(Boolean) ?? [],
    languages: one(sp.languages)?.split(",").filter(Boolean) ?? [],
    county: one(sp.county),
    city: one(sp.city),
    gender: one(sp.gender),
    minAge: one(sp.minAge),
    maxAge: one(sp.maxAge),
    minIg: one(sp.minInstagramFollowers),
    minTt: one(sp.minTiktokFollowers),
    verifiedOnly: one(sp.verifiedOnly) === "1",
    minRating: one(sp.minRating),
    sort: one(sp.sort) ?? "featured",
  };

  // Public-browse kapu: ha az admin kikapcsolta és nincs bejelentkezve,
  // a /login-re terelünk.
  const [publicView, currentUser] = await Promise.all([
    getSetting("public_view_creators").catch(() => false),
    getCurrentUser().catch(() => null),
  ]);
  if (!publicView && !currentUser) {
    return (
      <MembersOnlyGate
        next="/creators"
        title="Az alkotók böngészése csak tagoknak elérhető"
        description="Regisztrálj ingyen, és máris böngészheted a magyar tartalomgyártókat és kreatív szakembereket, vagy lépj be a fiókodba."
      />
    );
  }

  const [{ items: creators, hasMore }, totalCount] = await Promise.all([
    loadMoreCreators(0, filters),
    countCreators(filters),
  ]);

  const canSave = Boolean(await getCurrentBrand().catch(() => null));

  const activeFilterCount = [
    filters.search,
    filters.categories?.length ? "c" : "",
    filters.languages?.length ? "l" : "",
    filters.county,
    filters.city,
    filters.gender,
    filters.minAge,
    filters.maxAge,
    filters.minIg,
    filters.minTt,
    filters.verifiedOnly ? "v" : "",
    filters.minRating,
  ].filter(Boolean).length;

  return (
    <div
      className="relative -my-6 bg-[#f6f7f2]"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      <div className="mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-black/10 bg-white/90 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Szűrők
              </span>
              {activeFilterCount > 0 && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  {activeFilterCount}
                </Badge>
              )}
            </summary>
            <div className="border-t p-4">
              <BrowseFilters />
            </div>
          </details>

          <div className="hidden p-5 lg:block">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">Szűrők</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Finomhangold a válogatást, hogy csak releváns profilokat nézz
                  végig.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
            </div>
            <BrowseFilters />
          </div>
        </aside>

        <div className="min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Tartalomgyártók, Kreatív szakemberek
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalCount === 0
                  ? "Nincs a szűrőknek megfelelő találat."
                  : `${totalCount + 300} profil`}
              </p>
            </div>
            <SortSelect />
          </div>

          <div className="flex flex-wrap gap-2">
            {DIRECTORY_TYPES.map((type) => {
              const params = new URLSearchParams();
              for (const [key, value] of Object.entries(sp)) {
                const v = Array.isArray(value) ? value[0] : value;
                if (v && key !== "tipus") params.set(key, v);
              }
              if (type.value !== "all") params.set("tipus", type.value);
              const qs = params.toString();
              const active = tipus === type.value;

              return (
                <Link
                  key={type.value}
                  href={`/creators${qs ? `?${qs}` : ""}`}
                  className={
                    active
                      ? "rounded-full bg-accent px-4 py-2 text-sm font-bold text-black shadow-sm"
                      : "rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/10"
                  }
                >
                  {type.label}
                </Link>
              );
            })}
          </div>

          <CreatorsInfiniteGrid
            key={JSON.stringify(filters)}
            initial={creators}
            initialHasMore={hasMore}
            filters={filters}
            canSave={canSave}
          />

          <div className="relative overflow-hidden rounded-lg border border-black/10 bg-[#0b0d0a] p-6 text-white sm:p-7">
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Nem találtad meg, akit keresel?
                  </h3>
                  <p className="mt-1 text-sm text-white/65">
                    Írd le, milyen tartalomgyártót keresel, és segítünk
                    megtalálni a tökéletes partnert.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="shrink-0 bg-accent text-black hover:bg-white"
              >
                <Link href="/kapcsolat">
                  Keresési igény leadása <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
