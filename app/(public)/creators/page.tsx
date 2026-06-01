import { and, or, eq, gte, lte, ilike, desc, sql, inArray, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users, portfolioItems } from "@/lib/db/schema";
import { BrowseCreatorCard, type BrowseCard } from "@/components/creator/browse-creator-card";
import { BrowseFilters } from "@/components/creator/browse-filters";
import { SortSelect } from "@/components/creator/sort-select";

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

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <h2 className="mb-3 text-lg font-semibold">Szűrők</h2>
        <BrowseFilters />
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Tartalomgyártók</h1>
            <p className="text-sm text-muted-foreground">{creators.length} találat</p>
          </div>
          <SortSelect />
        </div>

        {creators.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Nincs a szűrőknek megfelelő tartalomgyártó.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.map((c) => (
              <BrowseCreatorCard key={c.username} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
