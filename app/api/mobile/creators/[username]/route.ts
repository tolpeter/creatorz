import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brandProfiles,
  creatorProfiles,
  portfolioItems,
  reviewResponses,
  reviews,
  users,
} from "@/lib/db/schema";
import { activityLabel } from "@/lib/creator-stats";
import { supabaseOgImage } from "@/lib/utils/og-image";
import { getMobileUser } from "@/lib/mobile-auth";
import { savedCreators } from "@/lib/db/schema";

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

  const [activeRow, items, reviewRows] = await Promise.all([
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
      languages: p.languages ?? [],
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
  });
}
