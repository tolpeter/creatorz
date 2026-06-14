import {
  extractFollowerCountAI,
  extractOgDescription,
  parseFollowerFromText,
} from "@/lib/ai/extract-followers";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Böngésző-szerű fejlécek — csökkentik a bot-blokkolás esélyét.
const BROWSER_HEADERS = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
};

function extractUsername(profileUrl: string): string | null {
  return (
    profileUrl.split("instagram.com/")[1]?.split("/")[0]?.split("?")[0] || null
  );
}

/**
 * Instagram követők.
 * 1. Publikus web_profile_info JSON végpont (x-ig-app-id) — pontos
 *    follower_count-ot ad, amíg az IP nincs rate-limitelve (429).
 * 2. Fallback: profil HTML regex, majd AI.
 *
 * Megjegyzés: az Instagram agresszíven rate-limiteli a datacenter IP-ket,
 * így alkalmanként 429 jön — ilyenkor a 4 napos cron újrapróbálja.
 */
export async function scrapeInstagramFollowers(
  profileUrl: string
): Promise<number | null> {
  const username = extractUsername(profileUrl);
  if (!username) return null;

  // 1) Publikus JSON API
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
          "x-ig-app-id": "936619743392459",
          Accept: "*/*",
        },
      }
    );
    if (res.ok) {
      const j = (await res.json()) as {
        data?: { user?: { edge_followed_by?: { count?: number } } };
      };
      const n = j?.data?.user?.edge_followed_by?.count;
      if (typeof n === "number" && n > 0) return n;
    }
  } catch {
    /* tovább a HTML fallbackra */
  }

  // 2) HTML: og:description + JSON regex + AI fallback
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return null;
    const html = await res.text();

    // og:description: "58 követő, 14 követés, 12 bejegyzés – …"
    const fromOg = parseFollowerFromText(extractOgDescription(html) ?? "");
    if (fromOg) return fromOg;

    // Beágyazott JSON
    const match =
      html.match(/"edge_followed_by":\{"count":(\d+)\}/) ||
      html.match(/"follower_count":(\d+)/);
    if (match) {
      const n = parseInt(match[1]!, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }

    return await extractFollowerCountAI("Instagram", html);
  } catch {
    return null;
  }
}
