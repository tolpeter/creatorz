import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude API alapú követőszám-kinyerés egy social profil HTML-jéből.
 * A regex-scrape fallback-jaként hívandó: amikor az regex nem találja meg.
 *
 * Stratégia:
 *  - A teljes HTML-t levágjuk a head + a body első ~10kB-jára (a JSON-LD,
 *    Open Graph metaadatok, és a kezdő SSR JSON itt szokott lenni).
 *  - Claude Haiku (gyors + olcsó) elolvassa, megtalálja a follower-számot.
 *  - Validáljuk az eredményt (egész szám 0..1 milliárd).
 *
 * Költség becslés: ~5000 token input × $0.80/M = $0.004 / hívás (Haiku 4).
 * 100 tartalomgyártó × naponta = ~$0.40 / hónap.
 */
export async function extractFollowerCountAI(
  platform: "Instagram" | "TikTok" | "Facebook" | "YouTube",
  html: string
): Promise<number | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Tipikus szempontok: head + script tagek + meta = az első 12kB-ben legtöbbször ott van
  const trimmed = html.length > 12_000 ? html.slice(0, 12_000) : html;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 32,
      messages: [
        {
          role: "user",
          content: `You are extracting a single number from a social media profile page.

Platform: ${platform}
Task: Find the total follower / subscriber / friend count for the profile shown on this page.

Rules:
- Return ONLY the integer number, nothing else.
- Expand abbreviations: "12.4K" → 12400, "2.5M" → 2500000, "1.2B" → 1200000000.
- If the page is not a profile page, or no follower count is visible, return: 0
- Do NOT include the word "followers", just the number.

HTML (truncated):
${trimmed}`,
        },
      ],
    });

    const block = msg.content[0];
    const text = block && block.type === "text" ? block.text : "";
    const n = parseInt(text.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000_000) return null;
    return n;
  } catch (err) {
    console.error("[ai] extractFollowerCountAI failed:", (err as Error).message);
    return null;
  }
}
