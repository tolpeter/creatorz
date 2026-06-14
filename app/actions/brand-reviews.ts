"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  collaborations,
  brandReviews,
  brandProfiles,
  creatorProfiles,
  notifications,
} from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";

const schema = z.object({
  overallRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  fairnessRating: z.coerce.number().int().min(1).max(5),
  clarityRating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(30, "Az értékelés legalább 30 karakter").max(2000),
});

/** Újraszámolja a márka average_rating + review_count mezőit (csak nem rejtett). */
async function recalcBrand(brandId: string) {
  const all = await db
    .select({ overallRating: brandReviews.overallRating })
    .from(brandReviews)
    .where(and(eq(brandReviews.brandId, brandId), eq(brandReviews.hidden, false)));
  const count = all.length;
  const avg = count > 0 ? all.reduce((s, r) => s + r.overallRating, 0) / count : null;
  await db
    .update(brandProfiles)
    .set({ reviewCount: count, averageRating: avg ? avg.toFixed(2) : null })
    .where(eq(brandProfiles.id, brandId));
}

export async function submitBrandReview(
  collabId: string,
  input: z.input<typeof schema>,
) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak tartalomgyártó értékelheti a márkát." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const [collab] = await db
    .select({
      id: collaborations.id,
      status: collaborations.status,
      completedAt: collaborations.completedAt,
      brandId: collaborations.brandId,
      brandUserId: brandProfiles.userId,
      creatorName: creatorProfiles.displayName,
    })
    .from(collaborations)
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(and(eq(collaborations.id, collabId), eq(collaborations.creatorId, creator.profile.id)))
    .limit(1);

  if (!collab) return { error: "Az együttműködés nem található." };

  const completed =
    !!collab.completedAt || collab.status === "closed" || collab.status === "reviewed";
  if (!completed) {
    return { error: "Csak lezárt együttműködést tudsz értékelni." };
  }

  const existing = await db
    .select({ id: brandReviews.id })
    .from(brandReviews)
    .where(eq(brandReviews.collaborationId, collabId))
    .limit(1);
  if (existing.length > 0) return { error: "Ezt az együttműködést már értékelted." };

  await db.insert(brandReviews).values({
    collaborationId: collabId,
    brandId: collab.brandId,
    creatorId: creator.profile.id,
    overallRating: d.overallRating,
    communicationRating: d.communicationRating,
    fairnessRating: d.fairnessRating,
    clarityRating: d.clarityRating,
    text: d.text,
  });

  await recalcBrand(collab.brandId);

  await db.insert(notifications).values({
    userId: collab.brandUserId,
    type: "brand_review",
    title: "Új értékelést kaptál ⭐",
    body: `${collab.creatorName} értékelte a márkádat (${d.overallRating}/5).`,
    link: "/brand/reviews",
  });

  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/reviews");
  return { success: true };
}
