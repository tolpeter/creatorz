import Link from "next/link";
import { ArrowRight, Sparkles, SlidersHorizontal } from "lucide-react";
import { loadMoreCreators, type BrowseFiltersInput } from "@/app/actions/browse";
import { BrowseFilters } from "@/components/creator/browse-filters";
import { SortSelect } from "@/components/creator/sort-select";
import { CreatorsInfiniteGrid } from "@/components/creator/creators-infinite-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Tartalomgyártók böngészése",
  description: "Találd meg a tökéletes magyar UGC tartalomgyártót a márkádhoz.",
};

type SP = Record<string, string | string[] | undefined>;
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CreatorsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const filters: BrowseFiltersInput = {
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

  // Első oldal a server action-ből (12 db)
  const { items: creators, hasMore } = await loadMoreCreators(0, filters);

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
    // Full-bleed: kitör a public layout max-w-6xl tárolójából
    <div
      className="relative -my-6"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR */}
        <aside className="border-b bg-card p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Szűrők</h2>
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
        </aside>

        {/* CONTENT */}
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tartalomgyártók</h1>
              <p className="text-sm text-muted-foreground">{creators.length}+ találat</p>
            </div>
            <SortSelect />
          </div>

          {/* Infinite grid */}
          <CreatorsInfiniteGrid
            initial={creators}
            initialHasMore={hasMore}
            filters={filters}
          />

          {/* Alsó CTA */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl"
            />
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Nem találtad meg, akit keresel?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Írd le, milyen tartalomgyártót keresel, és segítünk megtalálni a tökéletes
                    partnert.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
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
