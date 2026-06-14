import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Aktivitás-címke a legutóbbi belépés alapján. */
export function activityLabel(lastLoginAt: Date | null): string | null {
  if (!lastLoginAt) return null;
  const diffMs = Date.now() - new Date(lastLoginAt).getTime();
  const min = diffMs / 60000;
  if (min < 15) return "Aktív most";
  const h = min / 60;
  if (h < 24) return "Ma aktív";
  const d = Math.floor(h / 24);
  if (d === 1) return "Tegnap aktív";
  if (d < 7) return `${d} napja aktív`;
  if (d < 30) return `${Math.floor(d / 7)} hete aktív`;
  return null; // régi — ne keltsünk „halott" benyomást, inkább ne mutassuk
}

/**
 * Átlagos első-válaszidő: a creatorhoz BEÉRKEZETT üzenetek és az azokra adott
 * első válasz közti idő átlaga (órában). null, ha nincs elég adat.
 */
export async function getResponseStats(
  userId: string,
): Promise<{ label: string | null; avgHours: number | null }> {
  try {
    const rows = await db.execute(sql`
      select avg(extract(epoch from (first_reply - recv)) / 3600.0)::float as avg_hours,
             count(*)::int as n
      from (
        select m.created_at as recv,
          (select min(r.created_at) from messages r
           where r.from_user_id = ${userId}
             and r.to_user_id = m.from_user_id
             and r.created_at > m.created_at) as first_reply
        from messages m
        where m.to_user_id = ${userId}
      ) t
      where first_reply is not null
    `);
    // db.execute eredménye lehet sima tömb vagy { rows } — mindkettőt kezeljük.
    const list = (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
    const row = list[0];
    const n = Number(row?.n ?? 0);
    const avg = row?.avg_hours == null ? null : Number(row.avg_hours);
    if (!n || avg == null || Number.isNaN(avg)) return { label: null, avgHours: null };

    let label: string;
    if (avg < 1) label = "Általában 1 órán belül válaszol";
    else if (avg < 24) label = `Általában ${Math.round(avg)} órán belül válaszol`;
    else label = `Általában ${Math.round(avg / 24)} napon belül válaszol`;
    return { label, avgHours: avg };
  } catch {
    return { label: null, avgHours: null };
  }
}
