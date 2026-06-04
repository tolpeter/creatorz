import { extractFollowerCountAI } from "@/lib/ai/extract-followers";

/**
 * Facebook Page follower scrape — főleg AI fallback-re hagyatkozik
 * (a Meta gyakran változó struktúrája miatt).
 */
export async function scrapeFacebookFollowers(profileUrl: string): Promise<number | null> {
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const match =
      html.match(/"follower_count":(\d+)/) ||
      html.match(/(\d[\d ,.]*)\s*(?:followers|követő)/i);
    if (match) {
      const n = parseInt(match[1]!.replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) return n;
    }

    return await extractFollowerCountAI("Facebook", html);
  } catch {
    return null;
  }
}
