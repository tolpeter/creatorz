import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brandProfiles,
  creatorProfiles,
  portfolioItems,
  reviewResponses,
  reviews,
  users,
} from "@/lib/db/schema";
import { activityLabel, getResponseStats } from "@/lib/creator-stats";
import { CREATOR_CATEGORIES, LANGUAGES } from "@/lib/constants";
import { supabaseOgImage } from "@/lib/utils/og-image";
import { getMobileUser } from "@/lib/mobile-auth";
import { savedCreators } from "@/lib/db/schema";

type Equipment = { phone?: string; camera?: string; microphone?: string; editing?: string };
function catLabel(v: string) {
  return CREATOR_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
function langLabel(v: string) {
  return LANGUAGES.find((l) => l.value === v)?.label ?? v;
}
function normalizeEquipment(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const e = value as Equipment;
  return [
    { label: "Telefon", value: e.phone },
    { label: "Kamera", value: e.camera },
    { label: "Mikrofon", value: e.microphone },
    { label: "Vágás", value: e.editing },
  ].filter((i): i is { label: string; value: string } => Boolean(i.value));
}

export const dynamic = "force-dynamic";

/**
 * Egy tartalomgyártó publikus, JSON adatai a mobil detail-képernyőhöz.
 * GET /api/mobile/creators/:username
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const [p] = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });

  // Mentett-e a bejelentkezett márka kedvenceiben?
  let saved = false;
  const viewer = await getMobileUser(req);
  if (viewer?.role === "brand") {
    const [brand] = await db
      .select({ id: brandProfiles.id })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, viewer.id))
      .limit(1);
    if (brand) {
      const s = await db
        .select({ creatorId: savedCreators.creatorId })
        .from(savedCreators)
        .where(and(eq(savedCreators.brandId, brand.id), eq(savedCreators.creatorId, p.id)))
        .limit(1);
      saved = s.length > 0;
    }
  }

  const firstCategory = p.categories?.[0];
  const [activeRow, items, reviewRows, responseStats, similarRows] = await Promise.all([
    db.select({ lastLoginAt: users.lastLoginAt }).from(users).where(eq(users.id, p.userId)).limit(1),
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.creatorId, p.id))
      .orderBy(asc(portfolioItems.sortOrder)),
    db
      .select({
        id: reviews.id,
        overallRating: reviews.overallRating,
        text: reviews.text,
        createdAt: reviews.createdAt,
        brandName: brandProfiles.companyName,
        responseText: reviewResponses.text,
      })
      .from(reviews)
      .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
      .leftJoin(reviewResponses, eq(reviewResponses.reviewId, reviews.id))
      .where(and(eq(reviews.creatorId, p.id), eq(reviews.hidden, false)))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
    getResponseStats(p.userId).catch(() => ({ label: null as string | null })),
    firstCategory
      ? db
          .select({
            username: creatorProfiles.username,
            displayName: creatorProfiles.displayName,
            avatarUrl: creatorProfiles.avatarUrl,
            city: creatorProfiles.city,
            categories: creatorProfiles.categories,
            tiktokFollowers: creatorProfiles.tiktokFollowers,
            verified: creatorProfiles.verified,
            averageRating: creatorProfiles.averageRating,
            reviewCount: creatorProfiles.reviewCount,
          })
          .from(creatorProfiles)
          .where(
            and(
              ne(creatorProfiles.id, p.id),
              sql`${creatorProfiles.categories} @> ${JSON.stringify([firstCategory])}::jsonb`,
            ),
          )
          .limit(4)
      : Promise.resolve([]),
  ]);

  return Response.json({
    saved,
    profile: {
      username: p.username,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      bannerUrl: p.bannerUrl,
      bio: p.bio,
      city: p.city,
      county: p.county,
      age: p.age,
      gender: p.gender,
      categories: p.categories ?? [],
      categoryLabels: (p.categories ?? []).map(catLabel),
      languages: p.languages ?? [],
      languageLabels: (p.languages ?? []).map(langLabel),
      profileKind: p.profileKind,
      professionalRoles: p.professionalRoles ?? [],
      specialties: p.specialties ?? [],
      websiteUrl: p.websiteUrl,
      verified: p.verified,
      isFeatured: p.isFeatured || p.isAdminFeatured,
      introVideoUrl: p.introVideoUrl,
      instagramUrl: p.instagramUrl,
      instagramFollowers: p.instagramFollowers,
      tiktokUrl: p.tiktokUrl,
      tiktokFollowers: p.tiktokFollowers,
      tiktokLikes: p.tiktokLikes,
      tiktokVideoCount: p.tiktokVideoCount,
      facebookUrl: p.facebookUrl,
      facebookFollowers: p.facebookFollowers,
      youtubeUrl: p.youtubeUrl,
      youtubeSubscribers: p.youtubeSubscribers,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      activity: activityLabel(activeRow[0]?.lastLoginAt ?? null),
      responseLabel: responseStats?.label ?? null,
      equipment: normalizeEquipment(p.equipment),
    },
    portfolio: items.map((i) => ({
      id: i.id,
      type: i.type,
      // Fotóknál render-JPEG/PNG (a böngésző/RN által nem támogatott tiff stb. miatt).
      url: i.type === "photo" ? supabaseOgImage(i.url, { width: 1200 }) : i.url,
      thumbnailUrl: i.thumbnailUrl ? supabaseOgImage(i.thumbnailUrl, { width: 800 }) : null,
      externalUrl: i.externalUrl,
      title: i.title,
    })),
    reviews: reviewRows,
    similar: similarRows.map((s) => ({
      username: s.username,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      city: s.city,
      categoryLabels: (s.categories ?? []).map(catLabel),
      tiktokFollowers: s.tiktokFollowers,
      verified: s.verified,
      averageRating: s.averageRating,
      reviewCount: s.reviewCount,
    })),
  });
}
