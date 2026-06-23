import { and, desc, eq, gte, lte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users } from "@/lib/db/schema";
import { activityLabel } from "@/lib/creator-stats";

export const dynamic = "force-dynamic";

/**
 * Publikus, JSON creator-lista a mobil app (Expo) számára.
 * GET /api/mobile/creators?search=...&offset=0
 * Csak nyilvános, read-only adat — szerver oldali DB (RLS-független).
 */
const PAGE = 20;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const search = (sp.get("search") ?? "").trim();
  const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);
  const categories = (sp.get("categories") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const languages = (sp.get("languages") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const county = sp.get("county")?.trim() || "";
  const city = sp.get("city")?.trim() || "";
  const gender = sp.get("gender")?.trim() || "";
  const minAge = Number(sp.get("minAge") ?? 0) || 0;
  const maxAge = Number(sp.get("maxAge") ?? 0) || 0;
  const minIg = Number(sp.get("minIg") ?? 0) || 0;
  const minTt = Number(sp.get("minTt") ?? 0) || 0;
  const minRating = Number(sp.get("minRating") ?? 0) || 0;
  const verifiedOnly = sp.get("verified") === "1";

  const conditions = [eq(users.suspended, false)];
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(creatorProfiles.displayName, like),
        ilike(creatorProfiles.username, like),
        ilike(creatorProfiles.city, like),
      )!,
    );
  }
  // Kategóriák — ÉS feltétel (mindegyik kiválasztottnak meg kell felelnie).
  if (categories.length) {
    conditions.push(sql`${creatorProfiles.categories} @> ${JSON.stringify(categories)}::jsonb`);
  }
  // Nyelvek — VAGY feltétel (bármelyik egyezés).
  if (languages.length) {
    conditions.push(
      or(...languages.map((l) => sql`${creatorProfiles.languages} @> ${JSON.stringify([l])}::jsonb`))!,
    );
  }
  if (county) conditions.push(eq(creatorProfiles.county, county));
  if (city) conditions.push(ilike(creatorProfiles.city, `%${city}%`));
  if (gender) conditions.push(eq(creatorProfiles.gender, gender));
  if (minAge > 0) conditions.push(gte(creatorProfiles.age, minAge));
  if (maxAge > 0) conditions.push(lte(creatorProfiles.age, maxAge));
  if (minIg > 0) conditions.push(gte(creatorProfiles.instagramFollowers, minIg));
  if (minTt > 0) conditions.push(gte(creatorProfiles.tiktokFollowers, minTt));
  if (minRating > 0) conditions.push(gte(creatorProfiles.averageRating, String(minRating)));
  if (verifiedOnly) conditions.push(eq(creatorProfiles.verified, true));

  const rows = await db
    .select({
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      city: creatorProfiles.city,
      categories: creatorProfiles.categories,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      instagramFollowers: creatorProfiles.instagramFollowers,
      verified: creatorProfiles.verified,
      isFeatured: creatorProfiles.isFeatured,
      isAdminFeatured: creatorProfiles.isAdminFeatured,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
      lastLoginAt: users.lastLoginAt,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(...conditions))
    .orderBy(
      sql`(${creatorProfiles.isFeatured} or ${creatorProfiles.isAdminFeatured}) desc`,
      sql`(${creatorProfiles.avatarUrl} is not null and ${creatorProfiles.avatarUrl} <> '') desc`,
      sql`${creatorProfiles.averageRating} desc nulls last`,
      desc(creatorProfiles.createdAt),
    )
    .limit(PAGE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE;
  const items = rows.slice(0, PAGE).map((r) => ({
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    city: r.city,
    categories: r.categories ?? [],
    tiktokFollowers: r.tiktokFollowers,
    instagramFollowers: r.instagramFollowers,
    verified: r.verified,
    isFeatured: r.isFeatured || r.isAdminFeatured,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    activity: activityLabel(r.lastLoginAt),
  }));

  return Response.json(
    { items, hasMore, nextOffset: offset + PAGE },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
