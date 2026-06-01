import "server-only";
import { db } from "@/lib/db";
import { reviews, creatorProfiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/** Újraszámolja a creator review_count + average_rating mezőit (csak nem rejtett). */
export async function recalcAfterHide(creatorId: string) {
  const all = await db
    .select({ overallRating: reviews.overallRating })
    .from(reviews)
    .where(and(eq(reviews.creatorId, creatorId), eq(reviews.hidden, false)));

  const count = all.length;
  const avg = count > 0 ? all.reduce((s, r) => s + r.overallRating, 0) / count : null;

  await db
    .update(creatorProfiles)
    .set({ reviewCount: count, averageRating: avg ? avg.toFixed(2) : null })
    .where(eq(creatorProfiles.id, creatorId));
}
