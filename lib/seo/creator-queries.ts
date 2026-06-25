import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users } from "@/lib/db/schema";
import type { CreatorCardData } from "@/components/creator/creator-card";

/**
 * Publikus SEO-landing lekérdezések (kategória / megye szerint). Nincs auth-
 * függés (a böngésző `loadMoreCreators`-szal ellentétben), hogy a publikus,
 * indexelhető oldalakon biztosan működjön.
 *
 * Rendezés: kiemeltek elöl → akinek van profilképe → értékelés → legújabb.
 * Láthatóság: nem felfüggesztett.
 */

const SELECT = {
  username: creatorProfiles.username,
  displayName: creatorProfiles.displayName,
  avatarUrl: creatorProfiles.avatarUrl,
  city: creatorProfiles.city,
  categories: creatorProfiles.categories,
  instagramFollowers: creatorProfiles.instagramFollowers,
  instagramVerified: creatorProfiles.instagramVerified,
  tiktokFollowers: creatorProfiles.tiktokFollowers,
  tiktokVerified: creatorProfiles.tiktokVerified,
  isFeatured: creatorProfiles.isFeatured,
  isAdminFeatured: creatorProfiles.isAdminFeatured,
  averageRating: creatorProfiles.averageRating,
  reviewCount: creatorProfiles.reviewCount,
};

const ORDER = [
  sql`(${creatorProfiles.isFeatured} or ${creatorProfiles.isAdminFeatured}) desc`,
  sql`(${creatorProfiles.avatarUrl} is not null and ${creatorProfiles.avatarUrl} <> '') desc`,
  sql`${creatorProfiles.averageRating} desc nulls last`,
  desc(creatorProfiles.createdAt),
];

type Row = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  categories: string[] | null;
  instagramFollowers: number | null;
  instagramVerified: boolean;
  tiktokFollowers: number | null;
  tiktokVerified: boolean;
  isFeatured: boolean;
  isAdminFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
};

function toCard(r: Row): CreatorCardData {
  return {
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    city: r.city,
    categories: r.categories ?? [],
    instagramFollowers: r.instagramFollowers,
    instagramVerified: r.instagramVerified,
    tiktokFollowers: r.tiktokFollowers,
    tiktokVerified: r.tiktokVerified,
    isFeatured: r.isFeatured || r.isAdminFeatured,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
  };
}

export async function creatorsByCategory(value: string, limit = 24): Promise<CreatorCardData[]> {
  const rows = await db
    .select(SELECT)
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(
      and(
        eq(users.suspended, false),
        sql`${creatorProfiles.categories} @> ${JSON.stringify([value])}::jsonb`,
      ),
    )
    .orderBy(...ORDER)
    .limit(limit);
  return (rows as Row[]).map(toCard);
}

export async function creatorsByCounty(county: string, limit = 24): Promise<CreatorCardData[]> {
  const rows = await db
    .select(SELECT)
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(eq(users.suspended, false), eq(creatorProfiles.county, county)))
    .orderBy(...ORDER)
    .limit(limit);
  return (rows as Row[]).map(toCard);
}

async function countWhere(extra: ReturnType<typeof sql> | ReturnType<typeof eq>): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(eq(users.suspended, false), extra));
  return r?.n ?? 0;
}

export function countByCategory(value: string) {
  return countWhere(sql`${creatorProfiles.categories} @> ${JSON.stringify([value])}::jsonb`);
}
export function countByCounty(county: string) {
  return countWhere(eq(creatorProfiles.county, county));
}
