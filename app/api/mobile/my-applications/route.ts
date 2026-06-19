import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adApplications, ads, creatorProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett tartalomgyártó pályázatai (státusszal). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "creator") return Response.json({ items: [] });

  const [creator] = await db
    .select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);
  if (!creator) return Response.json({ items: [] });

  const rows = await db
    .select({
      id: adApplications.id,
      status: adApplications.status,
      createdAt: adApplications.createdAt,
      adId: ads.id,
      adSlug: ads.slug,
      adTitle: ads.title,
      adStatus: ads.status,
    })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .where(eq(adApplications.creatorId, creator.id))
    .orderBy(desc(adApplications.createdAt));

  return Response.json({ items: rows });
}
