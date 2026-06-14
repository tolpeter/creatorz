import "server-only";
import OpenAI from "openai";

/**
 * OpenAI alapú követőszám-kinyerés egy social profil HTML-jéből.
 * A regex/JSON-scrape fallback-jaként hívandó: amikor azok nem találják meg.
 *
 * Stratégia:
 *  - A HTML-ből a követőszámhoz releváns ~12kB-os ablakot vágjuk ki (a
 *    "follower"/"feliratkozó"/"subscriber"/"követő" kulcsszó köré centrálva),
 *    nem csak az első 12kB-ot — így YouTube/IG esetén is megtaláljuk a számot.
 *  - GPT-4o-mini (gyors + olcsó) elolvassa, megtalálja a follower-számot.
 *  - Validáljuk: egész szám 0..1 milliárd.
 *
 * Költség: ~5000 token input × $0.15/M = $0.0008 / hívás (gpt-4o-mini).
 */
export async function extractFollowerCountAI(
  platform: "Instagram" | "TikTok" | "Facebook" | "YouTube",
  html: string
): Promise<number | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const trimmed = relevantSlice(html, 12_000);

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 32,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract a single integer (follower/subscriber count) from social media profile HTML. Reply with ONLY the number, no other text.",
        },
        {
          role: "user",
          content: `Platform: ${platform}

Rules:
- Find the TOTAL follower / subscriber / friend count for the profile (not following, not video views, not likes-per-post).
- Expand English abbreviations: "12.4K" -> 12400, "2.5M" -> 2500000, "1.2B" -> 1200000000.
- Expand Hungarian abbreviations: "606 ezer" or "606 E" -> 606000, "1,2 millió" or "1,2 M" -> 1200000. Hungarian uses a comma as the decimal separator.
- "feliratkozó" = subscriber, "követő" = follower.
- If no profile or no follower count is visible, reply: 0
- Reply with ONLY the integer, digits only.

HTML (truncated):
${trimmed}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const n = parseInt(text.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000_000) return null;
    return n;
  } catch (err) {
    console.error("[ai] extractFollowerCountAI failed:", (err as Error).message);
    return null;
  }
}

/**
 * Kivág egy ~maxLen méretű ablakot a HTML-ből a követőszámhoz kapcsolódó
 * kulcsszó köré centrálva. Ha nincs kulcsszó, az első maxLen-t adja vissza.
 */
function relevantSlice(html: string, maxLen: number): string {
  if (html.length <= maxLen) return html;
  const keywords = [
    "subscriberCountText",
    "feliratkozó",
    "edge_followed_by",
    "follower_count",
    "Followers",
    "követő",
    "subscribers",
    "people follow",
  ];
  let idx = -1;
  for (const kw of keywords) {
    const i = html.indexOf(kw);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  if (idx === -1) return html.slice(0, maxLen);
  const half = Math.floor(maxLen / 2);
  const start = Math.max(0, idx - half);
  return html.slice(start, start + maxLen);
}

/**
 * Kinyeri az og:description meta tag tartalmát a HTML-ből.
 */
export function extractOgDescription(html: string): string | null {
  const m =
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
    );
  return m ? m[1] : null;
}

/** HTML entitások dekódolása (numerikus + pár nevesített). */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

/**
 * Egy szövegből (og:description vagy teljes HTML/oldalszöveg) kiolvassa a
 * követő/feliratkozó/kedvelés számot a kulcsszó-horgony mellől.
 *  - Instagram: "58 követő, 14 követés" -> 58, "58 Followers" -> 58
 *  - Facebook:  "64 773 ember kedveli" -> 64773, "12K followers" -> 12000
 *  - YouTube:   "606 ezer feliratkozó" -> 606000
 *  - Általános: "12.4K Followers" -> 12400
 *
 * Az egybetűs magyar/angol mértékegységek (E, M, B, K) csak akkor illenek,
 * ha szóköz követi őket — különben pl. az "ember" szó "e"-jét egységnek vennénk.
 */
export function parseFollowerFromText(text: string): number | null {
  if (!text) return null;
  const t = decodeHtmlEntities(text);
  const re =
    /([\d][\d.,\s ]*(?:\s*(?:ezer|millió|milliárd|(?:E|M|B|K)(?=\s)))?)\s*(?:követő|követi|feliratkozó|subscribers?|Followers?|people follow|people like|ember követi|ember kedveli|likes)/i;
  const m = t.match(re);
  if (!m) return null;
  return parseAbbreviatedCount(m[1]);
}

/**
 * Magyar/angol rövidített követőszám szövegből egész szám.
 * Pl. "606 ezer" -> 606000, "1,2 M" -> 1200000, "12.4K" -> 12400.
 * null, ha nem értelmezhető.
 */
export function parseAbbreviatedCount(raw: string): number | null {
  const m = raw
    .replace(/ /g, " ")
    .match(/([\d][\d.,\s]*)\s*(ezer|millió|milliárd|E|M|B|K|k|m|b)?/);
  if (!m) return null;
  // Numerikus rész normalizálása: szóközök ki; ha van mértékegység, a vessző/pont
  // tizedes; ha nincs, ezres elválasztók.
  const unit = (m[2] || "").toLowerCase();
  let numStr = m[1].replace(/\s/g, "");
  let mult = 1;
  if (unit === "ezer" || unit === "e" || unit === "k") mult = 1_000;
  else if (unit === "millió" || unit === "m") mult = 1_000_000;
  else if (unit === "milliárd" || unit === "b") mult = 1_000_000_000;

  if (mult > 1) {
    // Tizedes elválasztó: utolsó , vagy . a törtrész
    numStr = numStr.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    const val = parseFloat(numStr);
    if (!Number.isFinite(val)) return null;
    return Math.round(val * mult);
  }
  // Nincs mértékegység: ezres elválasztók eltávolítása
  const val = parseInt(numStr.replace(/[.,\s]/g, ""), 10);
  return Number.isFinite(val) && val > 0 ? val : null;
}
