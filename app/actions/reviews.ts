"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  collaborations,
  reviews,
  reviewResponses,
  creatorProfiles,
  brandProfiles,
  notifications,
  users,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/resend/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const reviewSchema = z.object({
  overallRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  qualityRating: z.coerce.number().int().min(1).max(5),
  deadlineRating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(30, "Az értékelés legalább 30 karakter").max(2000),
});

export async function submitReview(token: string, input: z.input<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }

  const rows = await db
    .select({
      id: collaborations.id,
      status: collaborations.status,
      brandId: collaborations.brandId,
      creatorId: collaborations.creatorId,
      creatorUserId: creatorProfiles.userId,
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
      creatorEmail: users.email,
    })
    .from(collaborations)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(collaborations.reviewToken, token))
    .limit(1);

  const collab = rows[0];
  if (!collab || collab.status !== "review_pending") {
    return { error: "Érvénytelen vagy lejárt értékelési link" };
  }

  const editedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d = parsed.data;

  await db
    .insert(reviews)
    .values({
      collaborationId: collab.id,
      brandId: collab.brandId,
      creatorId: collab.creatorId,
      overallRating: d.overallRating,
      communicationRating: d.communicationRating,
      qualityRating: d.qualityRating,
      deadlineRating: d.deadlineRating,
      text: d.text,
      editedUntil,
    })
    .onConflictDoNothing({ target: reviews.collaborationId });

  await db
    .update(collaborations)
    .set({ status: "reviewed" })
    .where(eq(collaborations.id, collab.id));

  await recalculateCreatorRating(collab.creatorId);

  await db.insert(notifications).values({
    userId: collab.creatorUserId,
    type: "review",
    title: "Új értékelést kaptál! ⭐",
    body: `${collab.brandName} értékelt téged.`,
    link: "/creator/reviews",
  });

  await sendEmailSafe({
    to: collab.creatorEmail,
    subject: "Új értékelést kaptál – Creatorz",
    html: `
      <h2>Új értékelést kaptál! ⭐</h2>
      <p>Szia ${collab.creatorName}!</p>
      <p>A(z) <strong>${collab.brandName}</strong> értékelt a közös munka után.</p>
      <p><a href="${APP_URL}/creator/reviews">Értékelés megtekintése és válasz</a></p>
    `,
  });

  revalidatePath("/creator/reviews");
  return { success: true };
}

async function recalculateCreatorRating(creatorId: string) {
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

const responseSchema = z.object({
  reviewId: z.string().uuid(),
  text: z.string().min(1).max(500),
});

export async function respondToReview(input: z.input<typeof responseSchema>) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen válasz" };

  // A review a sajátja-e?
  const r = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.id, parsed.data.reviewId), eq(reviews.creatorId, creator.profile.id)))
    .limit(1);
  if (!r[0]) return { error: "Az értékelés nem található" };

  const editedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db
    .insert(reviewResponses)
    .values({
      reviewId: parsed.data.reviewId,
      creatorId: creator.profile.id,
      text: parsed.data.text,
      editedUntil,
    })
    .onConflictDoUpdate({
      target: reviewResponses.reviewId,
      set: { text: parsed.data.text, editedUntil },
    });

  revalidatePath("/creator/reviews");
  return { success: true };
}

export async function reportReview(reviewId: string, reason: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const r = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.creatorId, creator.profile.id)))
    .limit(1);
  if (!r[0]) return { error: "Az értékelés nem található" };

  await db.update(reviews).set({ reported: true }).where(eq(reviews.id, reviewId));

  if (ADMIN_EMAIL) {
    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: "Értékelés bejelentve – Creatorz",
      html: `
        <h2>Egy értékelést bejelentettek</h2>
        <p>Review ID: ${reviewId}</p>
        <p>Indok: ${reason || "(nincs megadva)"}</p>
        <p><a href="${APP_URL}/admin/reports">Bejelentések az admin panelen</a></p>
      `,
    });
  }

  revalidatePath("/creator/reviews");
  return { success: true };
}
