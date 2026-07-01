"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { settings, users, creatorProfiles, reviews } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS, type SettingsKey } from "@/lib/settings";
import { recalcAfterHide } from "@/app/actions/_review-helpers";

async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

/**
 * Felhasználó VÉGLEGES törlése: a Supabase auth user + a public DB sor
 * (cascade törli a profilt, kampányokat, üzeneteket stb.). Admin nem
 * törölhető, és magadat sem törölheted.
 */
export async function deleteUser(userId: string) {
  const current = await requireAdmin();
  if (!current) return { error: "Csak admin" };

  const [target] = await db
    .select({ id: users.id, authId: users.authId, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { error: "A felhasználó nem található" };
  if (target.id === current.dbUser?.id) {
    return { error: "Magadat nem törölheted." };
  }
  if (target.role === "admin") {
    return { error: "Admin fiók nem törölhető." };
  }

  // 1) Supabase auth user törlése (best-effort — ha már nincs, megyünk tovább).
  if (target.authId) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(target.authId);
    } catch {
      // ignoráljuk — a DB-sor törlése a lényeg
    }
  }
  // 2) public DB sor — a FK-k ON DELETE CASCADE-del takarítanak.
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/users");
  revalidatePath("/admin/creators");
  revalidatePath("/admin/brands");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Facebook auto-poszt kapcsolat diagnosztika. Nem posztol kampányt, csak
 * validálja a tokent és egy törölhető teszt-bejegyzést tesz ki. A konkrét
 * Graph API hibaüzenetet visszaadja, hogy az admin lássa, mi a baj.
 */
export async function testFacebookConnection(): Promise<{
  ok: boolean;
  step?: string;
  error?: string;
  pageName?: string;
  postId?: string;
  env: { pageId: boolean; token: boolean };
}> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Csak admin", env: { pageId: false, token: false } };

  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  const env = { pageId: Boolean(pageId), token: Boolean(token) };
  if (!pageId || !token) {
    return {
      ok: false,
      step: "env",
      error:
        "Hiányzó env változó (FB_PAGE_ID és/vagy FB_PAGE_ACCESS_TOKEN). Állítsd be a Vercelben, majd Redeploy.",
      env,
    };
  }

  const GRAPH = "https://graph.facebook.com/v21.0";
  try {
    // 1) Token + Page ID validálása (GET, nem posztol).
    const r = await fetch(
      `${GRAPH}/${pageId}?fields=name,id&access_token=${encodeURIComponent(token)}`,
    );
    const j = (await r.json().catch(() => ({}))) as {
      name?: string;
      error?: { message?: string };
    };
    if (!r.ok || j.error) {
      return { ok: false, step: "validate", error: j?.error?.message || `HTTP ${r.status}`, env };
    }

    // 2) Valós teszt-poszt (törölhető) — ez ellenőrzi a pages_manage_posts jogot.
    const { postToFacebookPage } = await import("@/lib/facebook/post");
    const res = await postToFacebookPage({
      message:
        "Teszt: a Creatorz automata Facebook-poszt beállítása működik. Ez a bejegyzés nyugodtan törölhető.",
    });
    if (!res.posted) {
      return { ok: false, step: "post", error: res.error, pageName: j.name, env };
    }
    return { ok: true, pageName: j.name, postId: res.id, env };
  } catch (e) {
    return { ok: false, step: "network", error: (e as Error).message, env };
  }
}

/**
 * Emlékeztető email azoknak a BEFEJEZETT regisztrációjú tartalomgyártóknak,
 * akiknek nincs valódi profilképük (avatar null vagy Google-URL). A meglévő
 * "profilkép-ösztönző" template-et küldi, felhasználónként CSAK EGYSZER
 * (email_campaign_recipients dedup). Az összes-email kikapcsolókat tiszteli.
 */
export async function sendProfilePhotoReminders(): Promise<{
  ok: boolean;
  candidates?: number;
  sent?: number;
  error?: string;
}> {
  if (!(await requireAdmin())) return { ok: false, error: "Csak admin" };

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
  const CAMPAIGN = "profile-photo-nudge";
  const { randomBytes } = await import("crypto");
  const { sendEmailSafe } = await import("@/lib/resend/client");
  const { renderProfilePhotoNudgeEmail } = await import("@/lib/email/templates");
  const { emailCampaignRecipients } = await import("@/lib/db/schema");

  let todo: { userId: string; name: string | null; email: string }[] = [];
  try {
    const rows = await db.execute(sql`
      SELECT cp.user_id AS "userId", cp.display_name AS "name", u.email AS "email"
      FROM creator_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.onboarding_completed = true
        AND u.role = 'creator'
        AND u.suspended = false
        AND coalesce(u.email_prefs->>'all','') <> 'false'
        AND (cp.avatar_url IS NULL OR cp.avatar_url ILIKE '%googleusercontent.com%')
        AND NOT EXISTS (
          SELECT 1 FROM email_campaign_recipients r
          WHERE r.campaign = ${CAMPAIGN} AND r.user_id = cp.user_id
        )
      LIMIT 300
    `);
    const list = Array.isArray(rows)
      ? rows
      : (rows as { rows?: unknown[] }).rows ?? [];
    todo = (list as Record<string, unknown>[]).map((r) => ({
      userId: String(r.userId),
      name: r.name ? String(r.name) : null,
      email: String(r.email),
    }));
  } catch (e) {
    return { ok: false, error: "Lekérdezési hiba: " + (e as Error).message };
  }

  let sent = 0;
  for (const r of todo) {
    const token = randomBytes(16).toString("hex");
    const { subject, html } = renderProfilePhotoNudgeEmail({
      name: r.name || "alkotó",
      ctaUrl: `${APP_URL}/creator/profile`,
    });
    const res = await sendEmailSafe({ to: r.email, subject, html });
    if (res.sent) {
      await db
        .insert(emailCampaignRecipients)
        .values({
          campaign: CAMPAIGN,
          userId: r.userId,
          email: r.email,
          token,
          sentAt: new Date(),
        })
        .onConflictDoNothing();
      sent++;
    }
  }

  return { ok: true, candidates: todo.length, sent };
}

export async function updateSetting(
  key: string,
  value: boolean | number | string,
) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  if (!(key in DEFAULT_SETTINGS)) return { error: "Ismeretlen beállítás" };

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });

  revalidatePath("/admin/settings");
  revalidatePath("/creator/subscription");
  // Jogi adatok módosulása ezt is friss kell, hogy mutassa:
  if (key.startsWith("legal_")) {
    revalidatePath("/adatvedelem");
    revalidatePath("/aszf");
    revalidatePath("/cookies");
  }
  return { success: true };
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.update(users).set({ suspended, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { success: true };
}

const roleSchema = z.enum(["creator", "brand", "admin"]);
export async function setUserRole(userId: string, role: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "Érvénytelen szerepkör" };
  await db.update(users).set({ role: parsed.data, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserCanSeeViewers(userId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(users)
    .set({ canSeeViewers: value, updatedAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserApproved(userId: string, approved: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.update(users).set({ approved, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function setAdminFeatured(creatorId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  // Bekapcsolás: admin-kiemelés. Kikapcsolás: MINDEN kiemelés törlése
  // (admin override a fizetett kiemelésre is) — különben a badge bennragad.
  const set = value
    ? { isAdminFeatured: true, updatedAt: new Date() }
    : {
        isAdminFeatured: false,
        isFeatured: false,
        featuredUntil: null,
        updatedAt: new Date(),
      };
  await db
    .update(creatorProfiles)
    .set(set)
    .where(eq(creatorProfiles.id, creatorId));
  revalidatePath("/admin/creators");
  revalidatePath("/creators");
  return { success: true };
}

export async function setCreatorVerified(creatorId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(creatorProfiles)
    .set({
      verified: value,
      verifiedAt: value ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creatorId));
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function setReviewHidden(reviewId: string, hidden: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  const rows = await db
    .update(reviews)
    .set({ hidden, reported: hidden ? false : undefined })
    .where(eq(reviews.id, reviewId))
    .returning({ creatorId: reviews.creatorId });
  if (rows[0]) await recalcAfterHide(rows[0].creatorId);
  revalidatePath("/admin/reports");
  return { success: true };
}
