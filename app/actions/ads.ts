"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ads, creatorProfiles, notifications, users } from "@/lib/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const MAX_ACTIVE_ADS = 5;

// Opcionális pozitív egész vagy üres → null
const optionalBudget = z
  .union([z.coerce.number().int().min(1000), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : v));

const adSchema = z
  .object({
    title: z.string().min(5).max(80),
    description: z.string().min(50).max(2000),
    categories: z.array(z.string()).min(1).max(3),
    targetKinds: z
      .array(z.enum(["ugc", "editor", "photographer", "videographer"]))
      .min(1)
      .default(["ugc"]),
    contentType: z.enum(["video", "photo", "both"]),
    collaborationType: z.enum(["project", "longterm", "barter"]).default("project"),
    itemCount: z.coerce.number().int().min(1).max(20).optional().default(1),
    budgetMinHuf: optionalBudget,
    budgetMaxHuf: optionalBudget,
    budgetPublic: z.boolean().default(false),
    anonymous: z.boolean().default(false),
    coverUrl: z.string().max(600).optional().nullable(),
    deadline: z.coerce.date(),
    location: z.string().max(200).optional().or(z.literal("")),
    usageRights: z.enum(["organic", "paid_ads", "perpetual"]),
    referenceLinks: z.array(z.string()).max(5).default([]),
  })
  .refine(
    (d) =>
      d.budgetMinHuf == null ||
      d.budgetMaxHuf == null ||
      d.budgetMaxHuf >= d.budgetMinHuf,
    {
      message: "A maximum költségvetés nem lehet kisebb a minimumnál",
      path: ["budgetMaxHuf"],
    },
  )
  .refine((d) => d.deadline.getTime() > Date.now(), {
    message: "A határidő a jövőben legyen",
    path: ["deadline"],
  });

export async function createAd(input: z.input<typeof adSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka adhat fel hirdetést" };

  const rl = checkRateLimit(`ad:${brand.profile.id}`, 3, HOUR);
  if (!rl.allowed) return { error: "Túl sok hirdetés egy óra alatt. Próbáld később." };

  // (Adószám/székhely nem kötelező a hirdetésfeladáshoz.)

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
      targetKinds: d.targetKinds,
      contentType: d.contentType,
      collaborationType: d.collaborationType,
      itemCount: d.itemCount,
      coverUrl: d.coverUrl || null,
      budgetMinHuf: d.budgetMinHuf,
      budgetMaxHuf: d.budgetMaxHuf,
      budgetPublic: d.budgetPublic,
      anonymous: d.anonymous,
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

  const [ad] = await db
    .select({ title: ads.title, categories: ads.categories })
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);

  await db
    .update(ads)
    .set({ status: "active", approvedAt: new Date(), rejectionReason: null })
    .where(eq(ads.id, adId));

  // Keresési riasztás: a hirdetés kategóriáival egyező tartalomgyártók értesítése.
  await notifyMatchingCreators(adId, ad?.title ?? "", ad?.categories ?? []);

  revalidatePath("/admin");
  revalidatePath("/ads");
  return { success: true };
}

/** Új aktív hirdetésnél értesíti a kategóriával egyező, nem felfüggesztett creatorokat. */
async function notifyMatchingCreators(adId: string, title: string, categories: string[]) {
  if (!categories.length) return;
  try {
    const matches = await db
      .select({ userId: creatorProfiles.userId })
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(
        and(
          eq(users.suspended, false),
          or(
            ...categories.map(
              (c) => sql`${creatorProfiles.categories} @> ${JSON.stringify([c])}::jsonb`,
            ),
          )!,
        ),
      );
    if (!matches.length) return;
    await db.insert(notifications).values(
      matches.map((m) => ({
        userId: m.userId,
        type: "ad_match",
        title: "Új hirdetés a kategóriádban",
        body: title,
        link: `/ads/${adId}`,
      })),
    );
  } catch {
    // best-effort: a riasztás hibája ne akadályozza a jóváhagyást
  }
}

export async function setAdFeatured(adId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.update(ads).set({ isFeatured: value }).where(eq(ads.id, adId));
  revalidatePath("/admin/ads");
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
