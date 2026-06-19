import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedCreators, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett márka mentett tartalomgyártói. */
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
    .select({
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      city: creatorProfiles.city,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      verified: creatorProfiles.verified,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
    })
    .from(savedCreators)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, savedCreators.creatorId))
    .where(eq(savedCreators.brandId, brand.id))
    .orderBy(desc(savedCreators.createdAt));

  return Response.json({ items });
}
