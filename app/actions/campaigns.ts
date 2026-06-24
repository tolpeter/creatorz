"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
