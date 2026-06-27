import { randomBytes } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailCampaignRecipients } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderOnboardingReminderEmail } from "@/lib/email/templates";

export const maxDuration = 120;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
const CAMPAIGN = "onboarding-reminder";

/**
 * Emlékeztető azoknak a tartalomgyártóknak, akik elkezdték a regisztrációt,
 * de NEM fejezték be (onboardingCompleted = false). Egy felhasználó CSAK EGYSZER
 * kap emlékeztetőt (az email_campaign_recipients tábla unique(campaign,userId)).
 *
 * Célzás: 1 napnál régebbi, de max. 30 napos befejezetlen regisztrációk,
 * nem felfüggesztett, és nem kapcsolta ki az összes emailt.
 * Vercel cron hívja (naponta).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const BATCH = 50;

  let todo: { userId: string; name: string | null; email: string }[] = [];
  try {
    const rows = await db.execute(sql`
      SELECT cp.user_id AS "userId", cp.display_name AS "name", u.email AS "email"
      FROM creator_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.onboarding_completed = false
        AND u.role = 'creator'
        AND u.suspended = false
        AND u.created_at < now() - interval '1 day'
        AND u.created_at > now() - interval '30 days'
        AND coalesce(u.email_prefs->>'all','') <> 'false'
        AND NOT EXISTS (
          SELECT 1 FROM email_campaign_recipients r
          WHERE r.campaign = ${CAMPAIGN} AND r.user_id = cp.user_id
        )
      ORDER BY u.created_at ASC
      LIMIT ${BATCH}
    `);
    const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    todo = (list as Record<string, unknown>[]).map((r) => ({
      userId: String(r.userId),
      name: r.name ? String(r.name) : null,
      email: String(r.email),
    }));
  } catch (e) {
    return Response.json(
      { error: "query failed (migráció szükséges?)", detail: (e as Error).message },
      { status: 500 },
    );
  }

  let sent = 0;
  let failed = 0;
  for (const r of todo) {
    const token = randomBytes(16).toString("hex");
    const { subject, html } = renderOnboardingReminderEmail({
      name: r.name || "alkotó",
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

  return Response.json({ ok: true, candidates: todo.length, sent, failed });
}
