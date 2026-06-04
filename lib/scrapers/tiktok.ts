import { extractFollowerCountAI } from "@/lib/ai/extract-followers";

/**
 * TikTok follower scrape: 1. regex, 2. AI fallback.
 */
export async function scrapeTikTokFollowers(profileUrl: string): Promise<number | null> {
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const match =
      html.match(/"followerCount":(\d+)/) ||
      html.match(/"stats":\{[^}]*"followerCount":(\d+)/);
    if (match) {
      const n = parseInt(match[1]!, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }

    // AI fallback
    return await extractFollowerCountAI("TikTok", html);
  } catch {
    return null;
  }
}
