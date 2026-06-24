"use server";

import { randomBytes } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailCampaignRecipients } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderProfilePhotoNudgeEmail } from "@/lib/email/templates";

const CAMPAIGN = "profile-photo-2026-06";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

export type CampaignStat = {
  campaign: string;
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number; // a címzett azóta feltöltött profilképet
};

/** Email-kampányok összesített eredménye (csak admin). */
export async function getCampaignStats(): Promise<CampaignStat[]> {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return [];

  try {
    const rows = await db.execute(sql`
      SELECT
        r.campaign AS campaign,
        count(*)::int AS total,
        count(r.sent_at)::int AS sent,
        count(r.opened_at)::int AS opened,
        count(r.clicked_at)::int AS clicked,
        count(*) FILTER (
          WHERE cp.avatar_url IS NOT NULL AND cp.avatar_url <> ''
        )::int AS converted
      FROM email_campaign_recipients r
      LEFT JOIN creator_profiles cp ON cp.user_id = r.user_id
      GROUP BY r.campaign
      ORDER BY max(r.created_at) DESC
    `);

    const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    return (list as Record<string, unknown>[]).map((r) => ({
      campaign: String(r.campaign),
      total: Number(r.total) || 0,
      sent: Number(r.sent) || 0,
      opened: Number(r.opened) || 0,
      clicked: Number(r.clicked) || 0,
      converted: Number(r.converted) || 0,
    }));
  } catch {
    return []; // a migráció még nem futott le
  }
}

// ─────────────────────────── Profilkép-kampány küldés (admin) ──────────────

export type CampaignSendStatus = {
  eligible: number; // profilkép nélküli tartalomgyártók (összes)
  sent: number; // már megkapta a kampányt
  remaining: number; // még küldendő (profilkép nélküli ÉS nem kapott)
};

/** A profilkép-kampány aktuális állapota (admin). */
export async function getProfilePhotoCampaignStatus(): Promise<CampaignSendStatus> {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { eligible: 0, sent: 0, remaining: 0 };

  try {
    const rows = await db.execute(sql`
      SELECT
        (SELECT count(*) FROM creator_profiles cp JOIN users u ON u.id = cp.user_id
          WHERE (cp.avatar_url IS NULL OR cp.avatar_url = '') AND u.role = 'creator' AND u.suspended = false)::int AS eligible,
        (SELECT count(*) FROM email_campaign_recipients WHERE campaign = ${CAMPAIGN})::int AS sent,
        (SELECT count(*) FROM creator_profiles cp JOIN users u ON u.id = cp.user_id
          WHERE (cp.avatar_url IS NULL OR cp.avatar_url = '') AND u.role = 'creator' AND u.suspended = false
            AND coalesce(u.email_prefs->>'all','') <> 'false'
            AND coalesce(u.email_prefs->>'newsletter','') <> 'false'
            AND NOT EXISTS (SELECT 1 FROM email_campaign_recipients r WHERE r.campaign = ${CAMPAIGN} AND r.user_id = cp.user_id))::int AS remaining
    `);
    const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    const r = (list[0] ?? {}) as Record<string, unknown>;
    return {
      eligible: Number(r.eligible) || 0,
      sent: Number(r.sent) || 0,
      remaining: Number(r.remaining) || 0,
    };
  } catch {
    return { eligible: 0, sent: 0, remaining: 0 };
  }
}

/** Teszt-email a profilkép-kampányból (alapból az admin saját címére). */
export async function sendProfilePhotoTest(toEmail?: string) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { error: "Csak admin" };

  const to = (toEmail?.trim() || current.dbUser.email || "").trim();
  if (!to) return { error: "Nincs cél-email." };

  const token = "test-" + randomBytes(8).toString("hex");
  const { subject, html } = renderProfilePhotoNudgeEmail({
    name: "Teszt Felhasználó",
    ctaUrl: `${APP_URL}/api/email/c/${token}`,
    pixelUrl: `${APP_URL}/api/email/o/${token}`,
  });
  const res = await sendEmailSafe({ to, subject, html });
  if (!res.sent) return { error: `Nem sikerült: ${res.error ?? "ismeretlen hiba"}` };
  return { success: true, to };
}

/**
 * Egy adag (batch) kiküldése a profilkép nélküli tartalomgyártóknak.
 * Idempotens: aki már kapott, kimarad. Többször hívható, amíg a remaining 0.
 */
export async function sendProfilePhotoBatch(limit = 20) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { error: "Csak admin" };

  const batch = Math.min(Math.max(1, limit), 50);

  let todo: { userId: string; name: string | null; email: string }[] = [];
  try {
    const rows = await db.execute(sql`
      SELECT cp.user_id AS "userId", cp.display_name AS "name", u.email AS "email"
      FROM creator_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE (cp.avatar_url IS NULL OR cp.avatar_url = '')
        AND u.role = 'creator' AND u.suspended = false
        AND coalesce(u.email_prefs->>'all','') <> 'false'
        AND coalesce(u.email_prefs->>'newsletter','') <> 'false'
        AND NOT EXISTS (
          SELECT 1 FROM email_campaign_recipients r
          WHERE r.campaign = ${CAMPAIGN} AND r.user_id = cp.user_id
        )
      ORDER BY u.created_at ASC
      LIMIT ${batch}
    `);
    const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    todo = (list as Record<string, unknown>[]).map((r) => ({
      userId: String(r.userId),
      name: r.name ? String(r.name) : null,
      email: String(r.email),
    }));
  } catch {
    return { error: "A kampány-tábla még nincs létrehozva (migráció szükséges)." };
  }

  let sent = 0;
  let failed = 0;
  for (const r of todo) {
    const token = randomBytes(16).toString("hex");
    const { subject, html } = renderProfilePhotoNudgeEmail({
      name: r.name || "tartalomgyártó",
      ctaUrl: `${APP_URL}/api/email/c/${token}`,
      pixelUrl: `${APP_URL}/api/email/o/${token}`,
    });
    const res = await sendEmailSafe({ to: r.email, subject, html });
    if (res.sent) {
      await db
        .insert(emailCampaignRecipients)
        .values({ campaign: CAMPAIGN, userId: r.userId, email: r.email, token, sentAt: new Date() })
        .onConflictDoNothing();
      sent++;
    } else {
      failed++;
    }
  }

  const status = await getProfilePhotoCampaignStatus();
  return { success: true, sent, failed, remaining: status.remaining };
}
