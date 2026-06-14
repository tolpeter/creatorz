import {
  extractFollowerCountAI,
  extractOgDescription,
  parseFollowerFromText,
} from "@/lib/ai/extract-followers";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const BROWSER_HEADERS = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
};

/**
 * Facebook Page követőszám.
 * A követőszám publikusan látszik a Page oldalán (pl. "64 E követő" / "12K
 * followers"). Stratégia: og:description → teljes HTML szöveges minta → AI.
 *
 * Megjegyzés: a Facebook agresszíven blokkolja a datacenter IP-ket (gyakran
 * 400/redirect). Tiszta IP-ről (pl. Vercel) az og:description / a publikus
 * HTML elérhető; ahol blokkolt, a 4 napos cron újrapróbálja.
 */
export async function scrapeFacebookFollowers(
  profileUrl: string
): Promise<number | null> {
  // A locale kényszerítése segít konzisztens szöveges mintát kapni.
  const sep = profileUrl.includes("?") ? "&" : "?";
  const candidates = [`${profileUrl}${sep}locale=hu_HU`, profileUrl];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();

      // 1) og:description (gyakran tartalmazza a követőszámot)
      const fromOg = parseFollowerFromText(extractOgDescription(html) ?? "");
      if (fromOg) return fromOg;

      // 2) Beágyazott JSON mező
      const json = html.match(/"follower_count":(\d+)/);
      if (json) {
        const n = parseInt(json[1]!, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }

      // 3) Szöveges minta a teljes HTML-ben: "64 E követő" / "12K followers"
      const fromText = parseFollowerFromText(html);
      if (fromText) return fromText;

      // 4) AI fallback
      const ai = await extractFollowerCountAI("Facebook", html);
      if (ai) return ai;
    } catch {
      /* következő jelölt */
    }
  }
  return null;
}
