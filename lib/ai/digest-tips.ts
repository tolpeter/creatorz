import "server-only";
import OpenAI from "openai";

/**
 * Rövid, személyre szabott magyar tipp generálása (gpt-4o-mini) a heti
 * digest e-mailbe. Best-effort: hiba esetén null (a levél tipp nélkül megy).
 */
async function aiTip(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 120,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.error("[ai] aiTip failed:", (err as Error).message);
    return null;
  }
}

const CREATOR_SYSTEM =
  "Egy magyar UGC tartalomgyártó-platform asszisztense vagy. Adj EGY rövid (max. 2 mondat), konkrét, biztató tippet magyarul, hogy a tartalomgyártó több márka-megkeresést kapjon. Ne köszönj, ne ismételd az adatokat, csak a tipp jöjjön.";

const BRAND_SYSTEM =
  "Egy magyar UGC tartalomgyártó-platform asszisztense vagy. Adj EGY rövid (max. 2 mondat), konkrét, biztató tippet magyarul egy márkának, hogy több és jobb minőségű pályázatot kapjon a hirdetéseire. Ne köszönj, ne ismételd az adatokat, csak a tipp jöjjön.";

export function creatorWeeklyTip(data: {
  displayName: string;
  weeklyViews: number;
  completionPercent: number;
  missing: string[];
}): Promise<string | null> {
  const user = `Tartalomgyártó: ${data.displayName}
Profil-megtekintés a héten: ${data.weeklyViews}
Profil kitöltöttség: ${data.completionPercent}%
Hiányzó elemek: ${data.missing.length ? data.missing.join(", ") : "nincs"}

Adj egy testreszabott tippet ez alapján.`;
  return aiTip(CREATOR_SYSTEM, user);
}

export function brandWeeklyTip(data: {
  companyName: string;
  activeAds: number;
  newApplicants: number;
  weeklyViews: number;
}): Promise<string | null> {
  const user = `Márka: ${data.companyName}
Aktív hirdetések: ${data.activeAds}
Új pályázók a héten: ${data.newApplicants}
Hirdetés-megtekintések a héten: ${data.weeklyViews}

Adj egy testreszabott tippet ez alapján.`;
  return aiTip(BRAND_SYSTEM, user);
}
