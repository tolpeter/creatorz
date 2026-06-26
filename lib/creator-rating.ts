import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, reviews, creatorProjectReviews } from "@/lib/db/schema";

/**
 * Újraszámolja egy tartalomgyártó publikus csillag-átlagát és értékelés-számát
 * KÉT forrásból:
 *   - reviews                (márka → alkotó, a lezárt együttműködésekből)
 *   - creator_project_reviews (alkotó → alkotó, a közös projektekből; revieweeId)
 * Mindkettő nyilvánosan beleszámít.
 */
export async function recalcCreatorRating(creatorId: string): Promise<void> {
  const brand = await db
    .select({ r: reviews.overallRating })
    .from(reviews)
    .where(and(eq(reviews.creatorId, creatorId), eq(reviews.hidden, false)));

  let project: { r: number }[] = [];
  try {
    project = await db
      .select({ r: creatorProjectReviews.overallRating })
      .from(creatorProjectReviews)
      .where(eq(creatorProjectReviews.revieweeId, creatorId));
  } catch {
    project = []; // a reviewee-mezős migráció még nem futott le
  }

  const ratings = [...brand.map((x) => x.r), ...project.map((x) => x.r)];
  const count = ratings.length;
  const avg = count > 0 ? ratings.reduce((s, r) => s + r, 0) / count : null;

  await db
    .update(creatorProfiles)
    .set({ reviewCount: count, averageRating: avg ? avg.toFixed(2) : null })
    .where(eq(creatorProfiles.id, creatorId));
}
