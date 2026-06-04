import { extractFollowerCountAI } from "@/lib/ai/extract-followers";

/**
 * Instagram follower scrape: 1. regex (gyors), 2. AI fallback (megbízhatóbb).
 */
export async function scrapeInstagramFollowers(profileUrl: string): Promise<number | null> {
  try {
    const username = profileUrl.split("instagram.com/")[1]?.split("/")[0]?.split("?")[0];
    if (!username) return null;

    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const match =
      html.match(/"edge_followed_by":\{"count":(\d+)\}/) ||
      html.match(/"follower_count":(\d+)/);
    if (match) {
      const n = parseInt(match[1]!, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }

    // Regex hibázott → AI extrakció
    return await extractFollowerCountAI("Instagram", html);
  } catch {
    return null;
  }
}
