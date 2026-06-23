"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  ads,
  adApplications,
  adInvitations,
  collaborations,
  creatorProfiles,
  brandProfiles,
  portfolioItems,
  notifications,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentCreator, getCurrentBrand } from "@/lib/auth";
import { checkRateLimit, DAY } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";
import { sendExpoPush } from "@/lib/push";
import {
  renderNewApplicationEmail,
  renderApplicationAcceptedEmail,
  renderApplicationRejectedEmail,
} from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const applySchema = z.object({
  adId: z.string().uuid(),
  message: z.string().min(50, "Az üzenet legalább 50 karakter").max(2000),
});

export async function createApplication(input: z.input<typeof applySchema>) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak bejelentkezett creator pályázhat" };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const rl = checkRateLimit(`apply:${creator.profile.id}`, 10, DAY);
  if (!rl.allowed) return { error: "Elérted a napi 10 pályázat limitet." };

  // Profil teljesség: avatar + bio + min 1 portfólió. Csak a ténylegesen
  // hiányzó elemeket soroljuk fel (személyre szabottan).
  const pf = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id));
  const missing: string[] = [];
  if (!creator.profile.avatarUrl) missing.push("profilkép");
  if (!creator.profile.bio || creator.profile.bio.trim().length === 0)
    missing.push("bemutatkozás");
  if ((pf[0]?.n ?? 0) < 1) missing.push("legalább 1 portfólió elem");
  if (missing.length > 0) {
    return {
      error: `A pályázáshoz még hiányzik a profilodból: ${missing.join(", ")}. Töltsd ki a profilodnál, és próbáld újra.`,
    };
  }

  // Kampány léte + aktív státusz
  const adRows = await db
    .select({
      id: ads.id,
      title: ads.title,
      status: ads.status,
      brandUserEmail: users.email,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .innerJoin(users, eq(users.id, brandProfiles.userId))
    .where(eq(ads.id, d.adId))
    .limit(1);
  const ad = adRows[0];
  if (!ad) return { error: "A kampány nem található" };
  if (ad.status !== "active") return { error: "Erre a kampányra nem lehet pályázni" };

  // Beszúrás (egyediség: adId + creatorId)
  const inserted = await db
    .insert(adApplications)
    .values({
      adId: d.adId,
      creatorId: creator.profile.id,
      message: d.message,
    })
    .onConflictDoNothing({ target: [adApplications.adId, adApplications.creatorId] })
    .returning({ id: adApplications.id });

  if (!inserted[0]) return { error: "Erre a kampányra már pályáztál." };

  // Ha a creatort meghívták erre a kampányra, a meghívást „teljesítettre"
  // állítjuk — így a márka látja, hogy a meghívás pályázattá vált.
  await db
    .update(adInvitations)
    .set({ status: "applied", respondedAt: new Date() })
    .where(
      and(
        eq(adInvitations.adId, d.adId),
        eq(adInvitations.creatorId, creator.profile.id),
        eq(adInvitations.status, "pending"),
      ),
    );

  // Brand user a kampányhoz (értesítéshez)
  const brandUser = await db
    .select({ userId: brandProfiles.userId })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, d.adId))
    .limit(1);

  await db
    .update(ads)
    .set({ applicationCount: sql`${ads.applicationCount} + 1` })
    .where(eq(ads.id, d.adId));

  if (brandUser[0]) {
    await db.insert(notifications).values({
      userId: brandUser[0].userId,
      type: "application",
      title: `Új pályázat: ${creator.profile.displayName}`,
      body: `"${ad.title}" kampányodra érkezett egy pályázat.`,
      link: "/brand/ads",
    });
    await sendExpoPush([brandUser[0].userId], {
      title: "Új pályázat",
      body: `${creator.profile.displayName} pályázott: „${ad.title}"`,
      data: { type: "application" },
    });
  }

  {
    const email = renderNewApplicationEmail({
      creatorName: creator.profile.displayName,
      creatorUsername: creator.profile.username,
      creatorAvatarUrl: creator.profile.avatarUrl,
      adTitle: ad.title,
      messagePreview: d.message.slice(0, 220),
    });
    await sendEmailSafe({ to: ad.brandUserEmail, ...email });
  }

  revalidatePath("/creator/applications");
  return { success: true };
}

export async function withdrawApplication(applicationId: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const updated = await db
    .update(adApplications)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(adApplications.id, applicationId),
        eq(adApplications.creatorId, creator.profile.id),
        eq(adApplications.status, "pending")
      )
    )
    .returning({ adId: adApplications.adId });

  // A kampány pályázat-számlálóját is csökkentjük (0 alá nem mehet).
  if (updated[0]) {
    await db
      .update(ads)
      .set({ applicationCount: sql`GREATEST(${ads.applicationCount} - 1, 0)` })
      .where(eq(ads.id, updated[0].adId));
  }

  revalidatePath("/creator/applications");
  return { success: true };
}

async function loadApplicationForBrand(applicationId: string, brandId: string) {
  const rows = await db
    .select({
      appId: adApplications.id,
      adId: adApplications.adId,
      adTitle: ads.title,
      creatorId: adApplications.creatorId,
      creatorUserId: creatorProfiles.userId,
      creatorName: creatorProfiles.displayName,
      creatorEmail: users.email,
      adBrandId: ads.brandId,
      status: adApplications.status,
    })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(adApplications.id, applicationId))
    .limit(1);
  const row = rows[0];
  if (!row || row.adBrandId !== brandId) return null;
  return row;
}

export async function acceptApplication(applicationId: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };

  const row = await loadApplicationForBrand(applicationId, brand.profile.id);
  if (!row) return { error: "A pályázat nem található" };
  if (row.status !== "pending") {
    return { error: "Ez a pályázat már nem függőben van (vissza lett vonva vagy elbírálták)." };
  }

  // Státusz-őrzött frissítés: csak akkor lép tovább, ha tényleg pending volt
  // (két párhuzamos kattintás se hozhasson létre két együttműködést).
  const accepted = await db
    .update(adApplications)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(and(eq(adApplications.id, applicationId), eq(adApplications.status, "pending")))
    .returning({ id: adApplications.id });
  if (!accepted[0]) {
    return { error: "Ezt a pályázatot időközben már elbírálták." };
  }

  const reviewToken = randomBytes(24).toString("hex");
  await db
    .insert(collaborations)
    .values({
      adId: row.adId,
      applicationId: row.appId,
      brandId: brand.profile.id,
      creatorId: row.creatorId,
      reviewToken,
      status: "active",
    })
    .onConflictDoNothing();

  await db.insert(notifications).values({
    userId: row.creatorUserId,
    type: "application_accepted",
    title: "Elfogadták a pályázatodat! 🎉",
    body: `${brand.profile.companyName} elfogadta a pályázatodat: „${row.adTitle}".`,
    link: "/creator/applications",
  });

  await sendExpoPush([row.creatorUserId], {
    title: "Elfogadták a pályázatodat! 🎉",
    body: `${brand.profile.companyName}: „${row.adTitle}"`,
    data: { type: "application_accepted" },
  });

  {
    const email = renderApplicationAcceptedEmail({
      creatorName: row.creatorName,
      brandName: brand.profile.companyName,
      adTitle: row.adTitle,
    });
    await sendEmailSafe({ to: row.creatorEmail, ...email });
  }

  revalidatePath("/brand/ads");
  return { success: true };
}

export async function rejectApplication(applicationId: string, reason?: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };

  const row = await loadApplicationForBrand(applicationId, brand.profile.id);
  if (!row) return { error: "A pályázat nem található" };
  if (row.status !== "pending") {
    return { error: "Ez a pályázat már nem függőben van." };
  }

  const rejected = await db
    .update(adApplications)
    .set({ status: "rejected", respondedAt: new Date(), rejectionReason: reason || null })
    .where(and(eq(adApplications.id, applicationId), eq(adApplications.status, "pending")))
    .returning({ id: adApplications.id });
  if (!rejected[0]) {
    return { error: "Ezt a pályázatot időközben már elbírálták." };
  }

  await db.insert(notifications).values({
    userId: row.creatorUserId,
    type: "application_rejected",
    title: "Pályázatod elbírálva",
    body: `A(z) "${row.adTitle}" kampányra adott pályázatodat nem fogadták el.`,
    link: "/creator/applications",
  });

  {
    const email = renderApplicationRejectedEmail({
      creatorName: row.creatorName,
      adTitle: row.adTitle,
      reason: reason || undefined,
    });
    await sendEmailSafe({ to: row.creatorEmail, ...email });
  }

  revalidatePath("/brand/ads");
  return { success: true };
}
