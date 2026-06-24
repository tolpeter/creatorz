import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  collaborations,
  reviews,
  brandReviews,
  collaborationEvents,
  notifications,
  creatorProfiles,
  brandProfiles,
  ads,
} from "@/lib/db/schema";

/**
 * Lezárja az együttműködést, DE CSAK akkor, ha MINDKÉT fél értékelt
 * (a márka → tartalomgyártó és a tartalomgyártó → márka véleménye is megvan).
 * Addig az együttműködés "review_pending" állapotban marad. Kötelező szabály.
 *
 * @returns true, ha most zárult le; false, ha még hiányzik egy értékelés
 *          (vagy már korábban lezárult).
 */
export async function closeCollabIfBothReviewed(collabId: string): Promise<boolean> {
  const [byBrand] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.collaborationId, collabId))
    .limit(1);
  const [byCreator] = await db
    .select({ id: brandReviews.id })
    .from(brandReviews)
    .where(eq(brandReviews.collaborationId, collabId))
    .limit(1);

  // Csak akkor zárunk, ha MINDKÉT értékelés megvan.
  if (!byBrand || !byCreator) return false;

  const [c] = await db
    .select({
      completedAt: collaborations.completedAt,
      adTitle: ads.title,
      brandUserId: brandProfiles.userId,
      creatorUserId: creatorProfiles.userId,
    })
    .from(collaborations)
    .innerJoin(ads, eq(ads.id, collaborations.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(eq(collaborations.id, collabId))
    .limit(1);
  if (!c || c.completedAt) return false; // ismeretlen vagy már lezárva

  await db
    .update(collaborations)
    .set({ completedAt: new Date(), status: "closed" })
    .where(eq(collaborations.id, collabId));

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "completed",
      byUserId: null,
    });
  } catch {
    /* a collaboration_events migráció még nem futott le — ne álljon le */
  }

  await db.insert(notifications).values([
    {
      userId: c.brandUserId,
      type: "collab_completed",
      title: "Együttműködés lezárva ✅",
      body: `Mindketten értékeltétek a közös munkát: „${c.adTitle}". Az együttműködés lezárult.`,
      link: `/brand/collaborations/${collabId}`,
    },
    {
      userId: c.creatorUserId,
      type: "collab_completed",
      title: "Együttműködés lezárva ✅",
      body: `Mindketten értékeltétek a közös munkát: „${c.adTitle}". Az együttműködés lezárult.`,
      link: `/creator/collaborations/${collabId}`,
    },
  ]);

  return true;
}
