import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles, portfolioItems, profileViews } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { resolveViewers } from "@/lib/viewers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett user profil-statisztikája (kitöltöttség, megtekintések, kik nézték). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (user.role === "creator") {
    const [p] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1);
    if (!p) return Response.json({ role: "creator", completion: { percent: 0, items: [] } });

    const week = new Date(Date.now() - 7 * 86400000);
    const [portfolioRow, viewRow] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(portfolioItems).where(eq(portfolioItems.creatorId, p.id)),
      db
        .select({
          total: sql<number>`count(*)::int`,
          viewers: sql<number>`count(distinct ${profileViews.viewerUserId})::int`,
        })
        .from(profileViews)
        .where(and(eq(profileViews.creatorId, p.id), gte(profileViews.createdAt, week))),
    ]);
    const portfolioCount = portfolioRow[0]?.n ?? 0;
    const hasSocial = Boolean(p.instagramUrl || p.tiktokUrl || p.facebookUrl || p.youtubeUrl || p.instagramFollowers || p.tiktokFollowers);

    const items = [
      { label: "Profilkép", done: Boolean(p.avatarUrl) },
      { label: "Bemutatkozás", done: Boolean(p.bio && p.bio.trim().length >= 30) },
      { label: "Kategóriák", done: (p.categories?.length ?? 0) > 0 },
      { label: "Közösségi profil", done: hasSocial },
      { label: "Portfólió", done: portfolioCount > 0 },
      { label: "Bemutatkozó videó", done: Boolean(p.introVideoUrl) },
    ];
    const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);

    // Kik nézték (csak ha az admin bekapcsolta)
    let viewers: unknown[] = [];
    let anonymous = 0;
    if (user.canSeeViewers) {
      const grouped = await db
        .select({
          viewerUserId: profileViews.viewerUserId,
          lastAt: sql<Date>`max(${profileViews.createdAt})`,
          times: sql<number>`count(*)::int`,
        })
        .from(profileViews)
        .where(eq(profileViews.creatorId, p.id))
        .groupBy(profileViews.viewerUserId);
      anonymous = grouped.filter((g) => !g.viewerUserId).reduce((s, g) => s + g.times, 0);
      const ids = grouped.filter((g) => g.viewerUserId).map((g) => g.viewerUserId as string);
      const identities = await resolveViewers(ids);
      viewers = grouped
        .filter((g) => g.viewerUserId && identities.get(g.viewerUserId as string))
        .map((g) => {
          const id = identities.get(g.viewerUserId as string)!;
          return { name: id.name, type: id.type, username: id.username, avatarUrl: id.avatarUrl, lastAt: g.lastAt, times: g.times };
        })
        .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
        .slice(0, 50);
    }

    return Response.json({
      role: "creator",
      completion: { percent, items },
      views: { weekly: viewRow[0]?.total ?? 0, weeklyViewers: viewRow[0]?.viewers ?? 0 },
      reviewCount: p.reviewCount,
      averageRating: p.averageRating,
      verified: p.verified,
      canSeeViewers: user.canSeeViewers,
      viewers,
      anonymous,
    });
  }

  if (user.role === "brand") {
    const [p] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, user.id)).limit(1);
    const items = [
      { label: "Logó", done: Boolean(p?.logoUrl) },
      { label: "Kapcsolattartó", done: Boolean(p?.contactName) },
      { label: "Iparág", done: Boolean(p?.industry) },
      { label: "Weboldal", done: Boolean(p?.websiteUrl) },
      { label: "Bemutatkozás", done: Boolean(p?.description) },
    ];
    const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);
    return Response.json({ role: "brand", completion: { percent, items } });
  }

  return Response.json({ role: user.role, completion: { percent: 0, items: [] } });
}
