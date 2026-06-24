import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  collaborations,
  reviews,
  brandReviews,
  collaborationEvents,
  notifications,
  creatorProfiles,
  brandProfiles,
  users,
  ads,
} from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { isEmailAllowed } from "@/lib/email/prefs";
import { renderCollabUpdateEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

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
      brandName: brandProfiles.companyName,
      creatorName: creatorProfiles.displayName,
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

  // Email mindkét félnek (ha nem kapcsolták ki az "Együttműködések" kategóriát).
  try {
    const emails = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, [c.brandUserId, c.creatorUserId]));
    const emailOf = new Map(emails.map((u) => [u.id, u.email]));
    const targets = [
      { userId: c.brandUserId, name: c.brandName, path: "brand" },
      { userId: c.creatorUserId, name: c.creatorName, path: "creator" },
    ];
    for (const t of targets) {
      const email = emailOf.get(t.userId);
      if (!email) continue;
      if (!(await isEmailAllowed(t.userId, "collaborations"))) continue;
      const { subject, html } = renderCollabUpdateEmail({
        recipientName: t.name,
        subject: "Együttműködés lezárva — Creatorz",
        heading: "Együttműködés lezárva ✅",
        intro: `Mindketten értékeltétek a közös munkát a(z) „${c.adTitle}" projektnél — az együttműködés lezárult. Köszönjük!`,
        ctaLabel: "Megnyitás",
        ctaUrl: `${APP_URL}/${t.path}/collaborations/${collabId}`,
      });
      await sendEmailSafe({ to: email, subject, html });
    }
  } catch {
    /* best-effort */
  }

  return true;
}
