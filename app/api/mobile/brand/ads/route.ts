import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett márka aktív kampányai (a meghívás-választóhoz). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user || user.role !== "brand") return Response.json({ items: [] });

  const [brand] = await db
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);
  if (!brand) return Response.json({ items: [] });

  const items = await db
    .select({ id: ads.id, title: ads.title })
    .from(ads)
    .where(and(eq(ads.brandId, brand.id), eq(ads.status, "active")))
    .orderBy(desc(ads.createdAt));

  return Response.json({ items });
}
