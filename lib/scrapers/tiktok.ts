import { extractFollowerCountAI } from "@/lib/ai/extract-followers";

export type TikTokStats = {
  followers: number | null;
  likes: number | null; // összes szív/like a profilon
  avgViews: number | null; // átlagos megtekintés / videó
  videoCount: number | null;
};

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

/**
 * Bővített TikTok-statisztika a publikus profil HTML-jéből:
 *   - követő (followerCount)
 *   - összes like (heartCount)
 *   - videószám (videoCount)
 *   - átlagos megtekintés (a látható videók playCount-jainak átlaga)
 * A követőre van AI-fallback (a többi best-effort: ha nincs, null marad).
 */
export async function scrapeTikTokStats(profileUrl: string): Promise<TikTokStats> {
  const out: TikTokStats = { followers: null, likes: null, avgViews: null, videoCount: null };
  try {
    const res = await fetch(profileUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return out;
    const html = await res.text();

    const num = (re: RegExp): number | null => {
      const m = html.match(re);
      if (!m) return null;
      const n = parseInt(m[1]!, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    out.followers = num(/"followerCount":(\d+)/);
    out.likes = num(/"heartCount":(\d+)/) ?? num(/"heart":(\d+)/);
    out.videoCount = num(/"videoCount":(\d+)/);

    // Átlagos megtekintés: az összes videó-playCount átlaga (max 30 minta).
    const plays = [...html.matchAll(/"playCount":(\d+)/g)]
      .map((m) => parseInt(m[1]!, 10))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 30);
    if (plays.length > 0) {
      out.avgViews = Math.round(plays.reduce((a, b) => a + b, 0) / plays.length);
    }

    // Követő AI-fallback, ha a regex nem fogott.
    if (out.followers == null) {
      out.followers = await extractFollowerCountAI("TikTok", html);
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Visszafelé kompatibilis: csak a követőszám (a meglévő hívók ezt használják).
 */
export async function scrapeTikTokFollowers(profileUrl: string): Promise<number | null> {
  const stats = await scrapeTikTokStats(profileUrl);
  return stats.followers;
}
