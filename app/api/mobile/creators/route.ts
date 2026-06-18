import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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
  const search = (url.searchParams.get("search") ?? "").trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);

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
