"use server";

import {
  and,
  or,
  eq,
  gte,
  lte,
  gt,
  isNull,
  ilike,
  desc,
  sql,
  inArray,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users, portfolioItems } from "@/lib/db/schema";
import type { BrowseCard } from "@/components/creator/browse-creator-card";
import { getSavedCreatorIds } from "@/app/actions/saved";
import { activityLabel } from "@/lib/creator-stats";

export type BrowseFiltersInput = {
  // Típus-szűrő: "all" | "ugc" | "editor" | "photographer" | "videographer"
  tipus?: string;
  search?: string;
  categories?: string[];
  languages?: string[];
  county?: string;
  city?: string;
  gender?: string;
  minAge?: string;
  maxAge?: string;
  minIg?: string;
  minTt?: string;
  verifiedOnly?: boolean;
  minRating?: string;
  sort?: string;
};

const PAGE_SIZE = 12;

/** A szűrőkből felépíti a közös WHERE feltételeket (loadMore + count is használja). */
function buildConditions(filters: BrowseFiltersInput): SQL[] {
  const conditions: SQL[] = [eq(users.suspended, false)];

  // Típus-szűrő: UGC vagy kreatív szakember (szerepkör szerint)
  const tipus = filters.tipus ?? "all";
  if (tipus === "ugc") {
    conditions.push(eq(creatorProfiles.profileKind, "ugc"));
  } else if (["editor", "photographer", "videographer"].includes(tipus)) {
    conditions.push(eq(creatorProfiles.profileKind, "professional"));
    conditions.push(
      sql`${creatorProfiles.professionalRoles} @> ${JSON.stringify([tipus])}::jsonb`
    );
  }

  if (filters.search?.trim()) {
    const like = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(creatorProfiles.displayName, like),
        ilike(creatorProfiles.city, like),
        ilike(creatorProfiles.username, like),
        ilike(creatorProfiles.bio, like)
      )!
    );
  }

  if (filters.categories?.length) {
    // ÉS feltétel: a creatornak MINDEGYIK kiválasztott kategóriának meg kell
    // felelnie (a jsonb @> a teljes tömb tartalmazását ellenőrzi).
    conditions.push(
      sql`${creatorProfiles.categories} @> ${JSON.stringify(filters.categories)}::jsonb`
    );
  }

  if (filters.languages?.length) {
    conditions.push(
      or(
        ...filters.languages.map(
          (l) => sql`${creatorProfiles.languages} @> ${JSON.stringify([l])}::jsonb`
        )
      )!
    );
  }

  if (filters.county) conditions.push(eq(creatorProfiles.county, filters.county));
  if (filters.city) conditions.push(ilike(creatorProfiles.city, `%${filters.city}%`));
  if (filters.gender) conditions.push(eq(creatorProfiles.gender, filters.gender));

  if (filters.minAge && !isNaN(Number(filters.minAge)))
    conditions.push(gte(creatorProfiles.age, Number(filters.minAge)));
  if (filters.maxAge && !isNaN(Number(filters.maxAge)))
    conditions.push(lte(creatorProfiles.age, Number(filters.maxAge)));
  if (filters.minIg && !isNaN(Number(filters.minIg)))
    conditions.push(gte(creatorProfiles.instagramFollowers, Number(filters.minIg)));
  if (filters.minTt && !isNaN(Number(filters.minTt)))
    conditions.push(gte(creatorProfiles.tiktokFollowers, Number(filters.minTt)));

  if (filters.verifiedOnly) {
    conditions.push(
      or(
        eq(creatorProfiles.instagramVerified, true),
        eq(creatorProfiles.tiktokVerified, true)
      )!
    );
  }

  if (filters.minRating && !isNaN(Number(filters.minRating)))
    conditions.push(gte(creatorProfiles.averageRating, String(filters.minRating)));

  return conditions;
}

/** A szűrőknek megfelelő tartalomgyártók teljes száma (a fejléc-számlálóhoz). */
export async function countCreators(filters: BrowseFiltersInput): Promise<number> {
  const conditions = buildConditions(filters);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(...conditions));
  return rows[0]?.n ?? 0;
}

export async function loadFeaturedCreators(limit = 12): Promise<BrowseCard[]> {
  const now = new Date();
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
      verified: creatorProfiles.verified,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
      lastLoginAt: users.lastLoginAt,
      profileKind: creatorProfiles.profileKind,
      professionalRoles: creatorProfiles.professionalRoles,
      specialties: creatorProfiles.specialties,
      createdAt: creatorProfiles.createdAt,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(
      and(
        eq(users.suspended, false),
        or(
          eq(creatorProfiles.isAdminFeatured, true),
          and(
            eq(creatorProfiles.isFeatured, true),
            or(isNull(creatorProfiles.featuredUntil), gt(creatorProfiles.featuredUntil, now)),
          ),
        )!,
      ),
    )
    .orderBy(
      desc(creatorProfiles.isAdminFeatured),
      sql`(${creatorProfiles.avatarUrl} is not null and ${creatorProfiles.avatarUrl} <> '') desc`,
      sql`${creatorProfiles.averageRating} desc nulls last`,
      desc(creatorProfiles.createdAt),
    )
    .limit(limit);

  const ids = rows.map((r) => r.id);
  const videoOwners = ids.length
    ? await db
        .selectDistinct({ creatorId: portfolioItems.creatorId })
        .from(portfolioItems)
        .where(and(inArray(portfolioItems.creatorId, ids), eq(portfolioItems.type, "video")))
    : [];
  const videoSet = new Set(videoOwners.map((v) => v.creatorId));

  return rows.map((r) => ({
    id: r.id,
    saved: false,
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    city: r.city,
    county: r.county,
    categories: r.categories ?? [],
    instagramFollowers: r.instagramFollowers,
    tiktokFollowers: r.tiktokFollowers,
    isFeatured: true,
    verified: r.verified,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    hasVideo: videoSet.has(r.id),
    activity: activityLabel(r.lastLoginAt),
    profileKind: r.profileKind,
    professionalRoles: r.professionalRoles ?? [],
    specialties: r.specialties ?? [],
  }));
}

export async function loadMoreCreators(
  offset: number,
  filters: BrowseFiltersInput
): Promise<{ items: BrowseCard[]; hasMore: boolean }> {
  const conditions = buildConditions(filters);

  // Profilkép-prioritás: akinek van beállított profilképe, az előrébb kerül;
  // a profilkép nélküliek MINDEN rendezési módban leghátulra esnek.
  const hasAvatar = sql`(${creatorProfiles.avatarUrl} is not null and ${creatorProfiles.avatarUrl} <> '') desc`;
  const orderBy =
    filters.sort === "newest"
      ? [hasAvatar, desc(creatorProfiles.createdAt)]
      : filters.sort === "rating"
        ? [hasAvatar, sql`${creatorProfiles.averageRating} desc nulls last`, desc(creatorProfiles.reviewCount)]
        : [
            sql`(${creatorProfiles.isFeatured} or ${creatorProfiles.isAdminFeatured}) desc`,
            hasAvatar,
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
      verified: creatorProfiles.verified,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
      lastLoginAt: users.lastLoginAt,
      profileKind: creatorProfiles.profileKind,
      professionalRoles: creatorProfiles.professionalRoles,
      specialties: creatorProfiles.specialties,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;
  const slice = rows.slice(0, PAGE_SIZE);
  const ids = slice.map((r) => r.id);
  const videoOwners = ids.length
    ? await db
        .selectDistinct({ creatorId: portfolioItems.creatorId })
        .from(portfolioItems)
        .where(and(inArray(portfolioItems.creatorId, ids), eq(portfolioItems.type, "video")))
    : [];
  const videoSet = new Set(videoOwners.map((v) => v.creatorId));
  const savedSet = new Set(ids.length ? await getSavedCreatorIds(ids) : []);

  const items: BrowseCard[] = slice.map((r) => ({
    id: r.id,
    saved: savedSet.has(r.id),
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    city: r.city,
    county: r.county,
    categories: r.categories ?? [],
    instagramFollowers: r.instagramFollowers,
    tiktokFollowers: r.tiktokFollowers,
    isFeatured: r.isFeatured || r.isAdminFeatured,
    verified: r.verified,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    hasVideo: videoSet.has(r.id),
    activity: activityLabel(r.lastLoginAt),
    profileKind: r.profileKind,
    professionalRoles: r.professionalRoles ?? [],
    specialties: r.specialties ?? [],
  }));

  return { items, hasMore };
}
