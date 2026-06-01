import { and, or, eq, gte, lte, ilike, desc, asc, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { AdCard, type AdCardData } from "@/components/ad/ad-card";
import { AdsFilters } from "@/components/ad/ads-filters";
import { AdsSortSelect } from "@/components/ad/ads-sort-select";

export const metadata = {
  title: "Hirdetések",
  description: "Aktív márka-hirdetések magyar UGC tartalomgyártóknak.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdsFeedPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const conditions: SQL[] = [eq(ads.status, "active")];

  const categories = one(sp.categories)?.split(",").filter(Boolean) ?? [];
  if (categories.length) {
    conditions.push(
      or(...categories.map((c) => sql`${ads.categories} @> ${JSON.stringify([c])}::jsonb`))!
    );
  }

  const contentType = one(sp.contentType);
  if (contentType === "video" || contentType === "photo" || contentType === "both")
    conditions.push(eq(ads.contentType, contentType));

  const usageRights = one(sp.usageRights);
  if (usageRights) conditions.push(eq(ads.usageRights, usageRights));

  const location = one(sp.location);
  if (location) conditions.push(ilike(ads.location, `%${location}%`));

  const minBudget = one(sp.minBudget);
  if (minBudget && !isNaN(Number(minBudget)))
    conditions.push(gte(ads.budgetMaxHuf, Number(minBudget)));

  const deadline = one(sp.deadline);
  if (deadline === "week") {
    conditions.push(lte(ads.deadline, new Date(Date.now() + 7 * 86400000)));
  } else if (deadline === "month") {
    conditions.push(lte(ads.deadline, new Date(Date.now() + 30 * 86400000)));
  }

  const sort = one(sp.sort) ?? "newest";
  const orderBy =
    sort === "deadline"
      ? [asc(ads.deadline)]
      : sort === "budget"
        ? [desc(ads.budgetMaxHuf)]
        : [desc(ads.createdAt)];

  const rows = await db
    .select({
      id: ads.id,
      title: ads.title,
      categories: ads.categories,
      contentType: ads.contentType,
      budgetMinHuf: ads.budgetMinHuf,
      budgetMaxHuf: ads.budgetMaxHuf,
      deadline: ads.deadline,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(60);

  const items: AdCardData[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    brandName: r.brandName,
    brandLogo: r.brandLogo,
    categories: r.categories ?? [],
    contentType: r.contentType,
    budgetMinHuf: r.budgetMinHuf,
    budgetMaxHuf: r.budgetMaxHuf,
    deadline: r.deadline,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <h2 className="mb-3 text-lg font-semibold">Szűrők</h2>
        <AdsFilters />
      </aside>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Hirdetések</h1>
            <p className="text-sm text-muted-foreground">{items.length} aktív hirdetés</p>
          </div>
          <AdsSortSelect />
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Jelenleg nincs a szűrőknek megfelelő aktív hirdetés.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((a) => (
              <AdCard key={a.id} ad={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
