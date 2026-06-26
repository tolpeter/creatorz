"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ads, brandProfiles, creatorProfiles, notifications, users } from "@/lib/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";
import { slugify } from "@/lib/utils/slugify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const MAX_ACTIVE_ADS = 5;

// Opcionális pozitív egész vagy üres → null
const optionalBudget = z
  .union([z.coerce.number().int().min(1000), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : v));

const adObject = z.object({
  title: z
    .string()
    .min(5, "A cím legalább 5 karakter legyen")
    .max(80, "A cím legfeljebb 80 karakter lehet"),
  description: z
    .string()
    .min(50, "A leírás legalább 50 karakter legyen")
    .max(2000, "A leírás legfeljebb 2000 karakter lehet"),
  categories: z
    .array(z.string())
    .min(1, "Válassz legalább egy kategóriát")
    .max(3, "Legfeljebb 3 kategóriát választhatsz"),
  targetKinds: z
    .array(z.enum(["ugc", "influencer", "model", "editor", "photographer", "videographer"]))
    .min(1, "Jelölj meg legalább egy keresett típust")
    .default(["ugc"]),
  contentType: z.enum(["video", "photo", "both"]),
  collaborationType: z.enum(["project", "longterm", "barter"]).default("project"),
  itemCount: z.coerce.number().int().min(1).max(20).optional().default(1),
  budgetMinHuf: optionalBudget,
  budgetMaxHuf: optionalBudget,
  budgetPublic: z.boolean().default(false),
  anonymous: z.boolean().default(false),
  // Hány alkotót keres: "one" | "multiple" | null ("nem adom meg" → nem jelenik meg)
  seekingCount: z.enum(["one", "multiple"]).nullable().optional(),
  coverUrl: z.string().max(600).optional().nullable(),
  deadline: z.coerce.date(),
  location: z.string().max(200).optional().or(z.literal("")),
  usageRights: z.enum(["organic", "paid_ads", "perpetual"]),
  referenceLinks: z.array(z.string()).max(5).default([]),
});

const checkBudget = (d: z.infer<typeof adObject>) =>
  d.budgetMinHuf == null ||
  d.budgetMaxHuf == null ||
  d.budgetMaxHuf >= d.budgetMinHuf;
const budgetMsg = {
  message: "A maximum bérezés nem lehet kisebb a minimumnál",
  path: ["budgetMaxHuf"],
};

// Új kampány: a határidő legyen a jövőben.
const adSchema = adObject
  .refine(checkBudget, budgetMsg)
  .refine((d) => d.deadline.getTime() > Date.now(), {
    message: "A határidő a jövőben legyen",
    path: ["deadline"],
  });

// Szerkesztés: ugyanaz, de a már lejárt határidő ne blokkolja a mentést.
const adUpdateSchema = adObject.refine(checkBudget, budgetMsg);

/** Egyedi, SEO-barát slug a címből (ütközésnél -2, -3, …). */
async function uniqueAdSlug(title: string): Promise<string> {
  const base = slugify(title) || "hirdetes";
  let slug = base;
  let i = 2;
  while (
    (await db.select({ id: ads.id }).from(ads).where(eq(ads.slug, slug)).limit(1)).length > 0
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createAd(input: z.input<typeof adSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka adhat fel kampányt" };

  // (Adószám/székhely nem kötelező a kampányfeladáshoz.)

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
    return { error: `Egyszerre legfeljebb ${MAX_ACTIVE_ADS} aktív kampányod lehet.` };
  }

  // Rate limit CSAK a valós (érvényes) feladási kísérletnél számít — így a
  // form-hibák (pl. túl rövid cím) miatti újrapróbálkozás nem fogyasztja el.
  const rl = checkRateLimit(`ad:${brand.profile.id}`, 5, HOUR);
  if (!rl.allowed) {
    return { error: "Túl sok kampány egy óra alatt. Próbáld kicsit később." };
  }

  const inserted = await db
    .insert(ads)
    .values({
      brandId: brand.profile.id,
      title: d.title,
      slug: await uniqueAdSlug(d.title),
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
      seekingCount: d.seekingCount ?? null,
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
      subject: "Új moderálandó kampány – Creatorz",
      html: `
        <h2>Új kampány moderálásra vár</h2>
        <p><strong>${brand.profile.companyName}</strong> új kampányt adott fel:</p>
        <p style="font-weight:bold">${d.title}</p>
        <p>${d.description.slice(0, 200)}…</p>
        <p><a href="${APP_URL}/admin">Moderálás az admin panelen</a></p>
      `,
    });
  }

  revalidatePath("/brand/ads");
  return { success: true, id: adId };
}

/**
 * Admin kampány-létrehozás egy adott márka nevében (ha valaki közvetlenül az
 * adminisztrátort kéri meg a feladásra). A kampány rögtön aktív lesz.
 */
export async function adminCreateAd(brandId: string, input: z.input<typeof adSchema>) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { error: "Csak admin" };

  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const [brand] = await db
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(eq(brandProfiles.id, brandId))
    .limit(1);
  if (!brand) return { error: "A márka nem található" };

  const inserted = await db
    .insert(ads)
    .values({
      brandId: brand.id,
      title: d.title,
      slug: await uniqueAdSlug(d.title),
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
      seekingCount: d.seekingCount ?? null,
      deadline: d.deadline,
      location: d.location || null,
      usageRights: d.usageRights,
      referenceLinks: d.referenceLinks,
      // Admin által létrehozva → rögtön aktív.
      status: "active",
      approvedAt: new Date(),
    })
    .returning({ id: ads.id });

  revalidatePath("/admin/ads");
  revalidatePath("/ads");
  return { success: true, id: inserted[0]!.id };
}

export async function updateAd(adId: string, input: z.input<typeof adUpdateSchema>) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };
  const isAdmin = current.dbUser.role === "admin";

  // Admin bármelyik kampányt szerkesztheti; a márka csak a sajátját.
  let ownerBrandId: string | null = null;
  if (!isAdmin) {
    const brand = await getCurrentBrand();
    if (!brand) return { error: "Nincs bejelentkezve" };
    ownerBrandId = brand.profile.id;
  }

  const parsed = adUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const [existing] = await db
    .select({ id: ads.id, brandId: ads.brandId })
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);
  if (!existing || (!isAdmin && existing.brandId !== ownerBrandId)) {
    return { error: "A kampány nem található" };
  }

  // A slugot és a státuszt szándékosan NEM írjuk felül (az URL megmarad).
  await db
    .update(ads)
    .set({
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
      seekingCount: d.seekingCount ?? null,
      deadline: d.deadline,
      location: d.location || null,
      usageRights: d.usageRights,
      referenceLinks: d.referenceLinks,
    })
    .where(eq(ads.id, adId));

  revalidatePath(`/brand/ads/${adId}`);
  revalidatePath("/brand/ads");
  revalidatePath("/admin/ads");
  revalidatePath(`/ads/${adId}`);
  revalidatePath("/ads");
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

// ─────────────────── Kampány-életciklus (márka + admin) ────────────────────

const MANAGEABLE_TARGETS = ["active", "suspended", "expired", "closed"];

/**
 * Kampány státuszának állítása: aktív / felfüggesztve / lejárt / lezárva.
 * A márka a SAJÁT (már moderált) kampányát kezelheti, az admin BÁRMELYIKET.
 */
export async function setAdStatus(adId: string, status: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };
  const isAdmin = current.dbUser.role === "admin";

  if (!MANAGEABLE_TARGETS.includes(status)) return { error: "Érvénytelen státusz." };

  const [ad] = await db
    .select({ id: ads.id, status: ads.status, brandUserId: brandProfiles.userId })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, adId))
    .limit(1);
  if (!ad) return { error: "A kampány nem található." };

  const isOwner = ad.brandUserId === current.dbUser.id;
  if (!isAdmin && !isOwner) return { error: "Nincs jogosultságod ehhez a kampányhoz." };
  // Márka csak a már jóváhagyott (élő) kampányát módosíthatja így — a
  // pending/rejected → active az admin jóváhagyás dolga.
  if (!isAdmin && !MANAGEABLE_TARGETS.includes(ad.status)) {
    return { error: "Ez a kampány jóváhagyásra vár vagy elutasított — így nem módosítható." };
  }

  const set: Record<string, unknown> = { status };
  if (status === "closed") set.closedAt = new Date();
  if (status === "active") set.closedAt = null; // újraaktiválás

  await db.update(ads).set(set).where(eq(ads.id, adId));

  revalidatePath(`/brand/ads/${adId}`);
  revalidatePath("/brand/ads");
  revalidatePath("/admin/ads");
  revalidatePath("/ads");
  return { success: true };
}

/** Kampány törlése → ARCHÍVUM (soft-delete). Márka a sajátját, admin bármelyiket. */
export async function deleteAd(adId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };
  const isAdmin = current.dbUser.role === "admin";

  const [ad] = await db
    .select({ id: ads.id, brandUserId: brandProfiles.userId })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, adId))
    .limit(1);
  if (!ad) return { error: "A kampány nem található." };

  const isOwner = ad.brandUserId === current.dbUser.id;
  if (!isAdmin && !isOwner) return { error: "Nincs jogosultságod ehhez a kampányhoz." };

  // deletedAt = archívum; a status "closed"-ra állítása miatt minden
  // status='active' feed automatikusan kihagyja (nem kell mindenhol külön szűrni).
  await db
    .update(ads)
    .set({
      deletedAt: new Date(),
      deletedByRole: isAdmin ? "admin" : "brand",
      status: "closed",
    })
    .where(eq(ads.id, adId));

  revalidatePath("/brand/ads");
  revalidatePath("/admin/ads");
  revalidatePath("/ads");
  return { success: true };
}

/** Admin: archivált (törölt) kampány visszaállítása. */
export async function restoreAd(adId: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(ads)
    .set({ deletedAt: null, deletedByRole: null })
    .where(eq(ads.id, adId));
  revalidatePath("/admin/ads");
  revalidatePath("/brand/ads");
  revalidatePath("/ads");
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

  // Keresési riasztás: a kampány kategóriáival egyező tartalomgyártók értesítése.
  await notifyMatchingCreators(adId, ad?.title ?? "", ad?.categories ?? []);

  revalidatePath("/admin");
  revalidatePath("/ads");
  return { success: true };
}

/** Új aktív kampánynál értesíti a kategóriával egyező, nem felfüggesztett creatorokat. */
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
        title: "Új kampány a kategóriádban",
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
