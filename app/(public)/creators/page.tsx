import Link from "next/link";
import { Search, ArrowRight, Sparkles, SlidersHorizontal } from "lucide-react";
import { and, or, eq, gte, lte, ilike, desc, sql, inArray, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users, portfolioItems } from "@/lib/db/schema";
import { BrowseCreatorCard, type BrowseCard } from "@/components/creator/browse-creator-card";
import { BrowseFilters } from "@/components/creator/browse-filters";
import { SortSelect } from "@/components/creator/sort-select";
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

  const conditions: SQL[] = [eq(users.suspended, false)];

  const search = one(sp.search);
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(creatorProfiles.displayName, like),
        ilike(creatorProfiles.city, like),
        ilike(creatorProfiles.username, like)
      )!
    );
  }

  const categories = one(sp.categories)?.split(",").filter(Boolean) ?? [];
  if (categories.length) {
    conditions.push(
      or(
        ...categories.map(
          (c) => sql`${creatorProfiles.categories} @> ${JSON.stringify([c])}::jsonb`
        )
      )!
    );
  }

  const languages = one(sp.languages)?.split(",").filter(Boolean) ?? [];
  if (languages.length) {
    conditions.push(
      or(
        ...languages.map(
          (l) => sql`${creatorProfiles.languages} @> ${JSON.stringify([l])}::jsonb`
        )
      )!
    );
  }

  const county = one(sp.county);
  if (county) conditions.push(eq(creatorProfiles.county, county));

  const city = one(sp.city);
  if (city) conditions.push(ilike(creatorProfiles.city, `%${city}%`));

  const gender = one(sp.gender);
  if (gender) conditions.push(eq(creatorProfiles.gender, gender));

  const minAge = one(sp.minAge);
  if (minAge && !isNaN(Number(minAge))) conditions.push(gte(creatorProfiles.age, Number(minAge)));
  const maxAge = one(sp.maxAge);
  if (maxAge && !isNaN(Number(maxAge))) conditions.push(lte(creatorProfiles.age, Number(maxAge)));

  const minIg = one(sp.minInstagramFollowers);
  if (minIg && !isNaN(Number(minIg)))
    conditions.push(gte(creatorProfiles.instagramFollowers, Number(minIg)));
  const minTt = one(sp.minTiktokFollowers);
  if (minTt && !isNaN(Number(minTt)))
    conditions.push(gte(creatorProfiles.tiktokFollowers, Number(minTt)));

  if (one(sp.verifiedOnly) === "1") {
    conditions.push(
      or(
        eq(creatorProfiles.instagramVerified, true),
        eq(creatorProfiles.tiktokVerified, true)
      )!
    );
  }

  const minRating = one(sp.minRating);
  if (minRating && !isNaN(Number(minRating)))
    conditions.push(gte(creatorProfiles.averageRating, String(minRating)));

  const sort = one(sp.sort) ?? "featured";
  const orderBy =
    sort === "newest"
      ? [desc(creatorProfiles.createdAt)]
      : sort === "rating"
        ? [sql`${creatorProfiles.averageRating} desc nulls last`, desc(creatorProfiles.reviewCount)]
        : [
            sql`(${creatorProfiles.isFeatured} or ${creatorProfiles.isAdminFeatured}) desc`,
            sql`${creatorProfiles.averageRating} desc nulls last`,
            desc(creatorProfiles.createdAt),
          ];

  const rows = await db
    .select({
      id: creatorProfiles.id,
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      city: creatorProfiles.city,
      county: creatorProfiles.county,
      categories: creatorProfiles.categories,
      instagramFollowers: creatorProfiles.instagramFollowers,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      isFeatured: creatorProfiles.isFeatured,
      isAdminFeatured: creatorProfiles.isAdminFeatured,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(60);

  // Megnézzük, kinek van portfolió videója (a "Pitch videó" badge-hez)
  const ids = rows.map((r) => r.id);
  const videoOwners = ids.length
    ? await db
        .selectDistinct({ creatorId: portfolioItems.creatorId })
        .from(portfolioItems)
        .where(and(inArray(portfolioItems.creatorId, ids), eq(portfolioItems.type, "video")))
    : [];
  const hasVideoSet = new Set(videoOwners.map((v) => v.creatorId));

  const creators: BrowseCard[] = rows.map((r) => ({
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    city: r.city,
    county: r.county,
    categories: r.categories ?? [],
    instagramFollowers: r.instagramFollowers,
    tiktokFollowers: r.tiktokFollowers,
    isFeatured: r.isFeatured || r.isAdminFeatured,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    hasVideo: hasVideoSet.has(r.id),
  }));

  // Aktív szűrők számolása (badge a "Szűrők" mellé)
  const activeFilterCount = [
    search,
    categories.length ? "c" : "",
    languages.length ? "l" : "",
    county,
    city,
    gender,
    minAge,
    maxAge,
    minIg,
    minTt,
    one(sp.verifiedOnly) === "1" ? "v" : "",
    minRating,
  ].filter(Boolean).length;

  return (
    // Full-bleed: kitör a public layout max-w-6xl tárolójából, teljes viewport szélességet kap
    <div
      className="relative -my-6"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR — bal szélre rögzítve */}
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

      {/* CONTENT — paddinggel, középre */}
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tartalomgyártók</h1>
            <p className="text-sm text-muted-foreground">{creators.length} találat</p>
          </div>
          <SortSelect />
        </div>

        {/* Cards grid */}
        {creators.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Nincs a szűrőknek megfelelő tartalomgyártó.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <BrowseCreatorCard key={c.username} c={c} />
            ))}
          </div>
        )}

        {/* Alsó CTA: Nem találtad meg, akit keresel? */}
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
                  Írd le, milyen tartalomgyártót keresel, és segítünk megtalálni a tökéletes partnert.
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
