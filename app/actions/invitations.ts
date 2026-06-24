"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  ads,
  adApplications,
  adInvitations,
  creatorProfiles,
  notifications,
  users,
} from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";
import { isEmailAllowed } from "@/lib/email/prefs";
import { renderAdInvitationEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type InvitableAd = {
  id: string;
  title: string;
  alreadyInvited: boolean;
  alreadyApplied: boolean;
};

/**
 * A bejelentkezett márka aktív kampányai, jelezve melyikre hívta már meg /
 * pályázott már az adott tartalomgyártó. A meghívás-dialógus tölti fel ebből
 * a listát. Nem márka hívónál üres tömb.
 */
export async function getInvitableAds(creatorId: string): Promise<InvitableAd[]> {
  const brand = await getCurrentBrand();
  if (!brand) return [];

  // Best-effort: egy átmeneti DB-akadás ne dobjon hibát a creator-profilon.
  try {
    const activeAds = await db
      .select({ id: ads.id, title: ads.title })
      .from(ads)
      .where(and(eq(ads.brandId, brand.profile.id), eq(ads.status, "active")))
      .orderBy(desc(ads.createdAt));
    if (activeAds.length === 0) return [];

    const adIds = activeAds.map((a) => a.id);
    const [invited, applied] = await Promise.all([
      db
        .select({ adId: adInvitations.adId })
        .from(adInvitations)
        .where(and(inArray(adInvitations.adId, adIds), eq(adInvitations.creatorId, creatorId))),
      db
        .select({ adId: adApplications.adId })
        .from(adApplications)
        .where(and(inArray(adApplications.adId, adIds), eq(adApplications.creatorId, creatorId))),
    ]);
    const invitedSet = new Set(invited.map((r) => r.adId));
    const appliedSet = new Set(applied.map((r) => r.adId));

    return activeAds.map((a) => ({
      id: a.id,
      title: a.title,
      alreadyInvited: invitedSet.has(a.id),
      alreadyApplied: appliedSet.has(a.id),
    }));
  } catch {
    return [];
  }
}

const inviteSchema = z.object({
  adId: z.string().uuid(),
  creatorId: z.string().uuid(),
  message: z.string().max(1000).optional().or(z.literal("")),
});

/** Márka meghív egy tartalomgyártót egy konkrét, aktív kampányára. */
export async function inviteCreatorToAd(input: z.input<typeof inviteSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka hívhat meg creatort" };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  // Max 30 meghívás / óra — spam ellen.
  const rl = checkRateLimit(`invite:${brand.profile.id}`, 30, HOUR);
  if (!rl.allowed) return { error: "Túl sok meghívás egy óra alatt. Próbáld később." };

  // A kampány a márkáé és aktív.
  const [ad] = await db
    .select({ id: ads.id, title: ads.title, status: ads.status, brandId: ads.brandId })
    .from(ads)
    .where(eq(ads.id, d.adId))
    .limit(1);
  if (!ad || ad.brandId !== brand.profile.id) {
    return { error: "A kampány nem található" };
  }
  if (ad.status !== "active") {
    return { error: "Csak aktív kampányra lehet meghívni." };
  }

  // A creator létezik és nem felfüggesztett.
  const [recipient] = await db
    .select({
      creatorUserId: creatorProfiles.userId,
      displayName: creatorProfiles.displayName,
      email: users.email,
      suspended: users.suspended,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.id, d.creatorId))
    .limit(1);
  if (!recipient || recipient.suspended) {
    return { error: "A tartalomgyártó nem érhető el" };
  }

  // Ha már pályázott, fölösleges meghívni.
  const existingApp = await db
    .select({ id: adApplications.id })
    .from(adApplications)
    .where(and(eq(adApplications.adId, d.adId), eq(adApplications.creatorId, d.creatorId)))
    .limit(1);
  if (existingApp.length > 0) {
    return { error: "Ez a creator már pályázott erre a kampányra." };
  }

  // Beszúrás — egyediség (adId, creatorId). Ha már meghívtuk, nem duplázunk.
  const inserted = await db
    .insert(adInvitations)
    .values({
      adId: d.adId,
      brandId: brand.profile.id,
      creatorId: d.creatorId,
      message: d.message || null,
    })
    .onConflictDoNothing({ target: [adInvitations.adId, adInvitations.creatorId] })
    .returning({ id: adInvitations.id });
  if (!inserted[0]) {
    return { error: "Ezt a creatort már meghívtad erre a kampányra." };
  }

  await db.insert(notifications).values({
    userId: recipient.creatorUserId,
    type: "ad_invitation",
    title: `Meghívás egy kampányra: ${brand.profile.companyName}`,
    body: `„${ad.title}" — a márka kifejezetten téged hívott meg, hogy pályázz.`,
    link: `/ads/${d.adId}`,
  });

  if (await isEmailAllowed(recipient.creatorUserId, "applications")) {
    const email = renderAdInvitationEmail({
      creatorName: recipient.displayName,
      brandName: brand.profile.companyName,
      adTitle: ad.title,
      adUrl: `${APP_URL}/ads/${d.adId}`,
      message: d.message || undefined,
    });
    await sendEmailSafe({ to: recipient.email, ...email });
  }

  revalidatePath(`/creators`);
  return { success: true };
}
