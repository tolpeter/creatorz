"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ads } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const MAX_ACTIVE_ADS = 5;

const adSchema = z
  .object({
    title: z.string().min(5).max(80),
    description: z.string().min(50).max(2000),
    categories: z.array(z.string()).min(1).max(3),
    contentType: z.enum(["video", "photo", "both"]),
    itemCount: z.coerce.number().int().min(1).max(20),
    budgetMinHuf: z.coerce.number().int().min(1000),
    budgetMaxHuf: z.coerce.number().int().min(1000),
    deadline: z.coerce.date(),
    location: z.string().max(200).optional().or(z.literal("")),
    usageRights: z.enum(["organic", "paid_ads", "perpetual"]),
    referenceLinks: z.array(z.string()).max(5).default([]),
  })
  .refine((d) => d.budgetMaxHuf >= d.budgetMinHuf, {
    message: "A maximum költségvetés nem lehet kisebb a minimumnál",
    path: ["budgetMaxHuf"],
  })
  .refine((d) => d.deadline.getTime() > Date.now(), {
    message: "A határidő a jövőben legyen",
    path: ["deadline"],
  });

export async function createAd(input: z.input<typeof adSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka adhat fel hirdetést" };

  const rl = checkRateLimit(`ad:${brand.profile.id}`, 3, HOUR);
  if (!rl.allowed) return { error: "Túl sok hirdetés egy óra alatt. Próbáld később." };

  // Részletes adatok kötelezőek hirdetésfeladáshoz
  if (!brand.profile.taxNumber || !brand.profile.address) {
    return {
      error:
        "Hirdetésfeladáshoz töltsd ki az adószámot és a székhelyet a Cég profil oldalon.",
    };
  }

  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const activeRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(ads)
    .where(and(eq(ads.brandId, brand.profile.id), inArray(ads.status, ["pending", "active"])));
  if ((activeRows[0]?.n ?? 0) >= MAX_ACTIVE_ADS) {
    return { error: `Egyszerre legfeljebb ${MAX_ACTIVE_ADS} aktív hirdetésed lehet.` };
  }

  const inserted = await db
    .insert(ads)
    .values({
      brandId: brand.profile.id,
      title: d.title,
      description: d.description,
      categories: d.categories,
      contentType: d.contentType,
      itemCount: d.itemCount,
      budgetMinHuf: d.budgetMinHuf,
      budgetMaxHuf: d.budgetMaxHuf,
      deadline: d.deadline,
      location: d.location || null,
      usageRights: d.usageRights,
      referenceLinks: d.referenceLinks,
      status: "pending",
    })
    .returning({ id: ads.id });

  const adId = inserted[0]!.id;

  if (ADMIN_EMAIL) {
    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: "Új moderálandó hirdetés – Creatorz",
      html: `
        <h2>Új hirdetés moderálásra vár</h2>
        <p><strong>${brand.profile.companyName}</strong> új hirdetést adott fel:</p>
        <p style="font-weight:bold">${d.title}</p>
        <p>${d.description.slice(0, 200)}…</p>
        <p><a href="${APP_URL}/admin">Moderálás az admin panelen</a></p>
      `,
    });
  }

  revalidatePath("/brand/ads");
  return { success: true, id: adId };
}

export async function closeAd(adId: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };

  await db
    .update(ads)
    .set({ status: "closed", closedAt: new Date() })
    .where(and(eq(ads.id, adId), eq(ads.brandId, brand.profile.id)));

  revalidatePath("/brand/ads");
  return { success: true };
}

// --- Admin moderálás (8. fázisban kap UI-t; role-guard itt is) ---
async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

export async function approveAd(adId: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(ads)
    .set({ status: "active", approvedAt: new Date(), rejectionReason: null })
    .where(eq(ads.id, adId));
  revalidatePath("/admin");
  revalidatePath("/ads");
  return { success: true };
}

export async function rejectAd(adId: string, reason: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(ads)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(ads.id, adId));
  revalidatePath("/admin");
  return { success: true };
}
