import { db } from "@/lib/db";
import { creatorProfiles } from "@/lib/db/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const updated = await db
    .update(creatorProfiles)
    .set({ isFeatured: false, featuredUntil: null })
    .where(
      and(
        eq(creatorProfiles.isFeatured, true),
        eq(creatorProfiles.isAdminFeatured, false),
        isNotNull(creatorProfiles.featuredUntil),
        lte(creatorProfiles.featuredUntil, now)
      )
    )
    .returning({ id: creatorProfiles.id });

  return Response.json({ updated: updated.length });
}
