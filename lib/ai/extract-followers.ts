import "server-only";
import OpenAI from "openai";

/**
 * OpenAI alapú követőszám-kinyerés egy social profil HTML-jéből.
 * A regex-scrape fallback-jaként hívandó: amikor az regex nem találja meg.
 *
 * Stratégia:
 *  - A teljes HTML-t levágjuk az első ~12kB-ra (head + script JSON-LD + SSR JSON).
 *  - GPT-4o-mini (gyors + olcsó) elolvassa, megtalálja a follower-számot.
 *  - Validáljuk: egész szám 0..1 milliárd.
 *
 * Költség: ~5000 token input × $0.15/M = $0.0008 / hívás (gpt-4o-mini).
 * 100 tartalomgyártó × naponta = ~$0.08 / hónap (~30 Ft).
 */
export async function extractFollowerCountAI(
  platform: "Instagram" | "TikTok" | "Facebook" | "YouTube",
  html: string
): Promise<number | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const trimmed = html.length > 12_000 ? html.slice(0, 12_000) : html;

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
            "You extract a single integer (follower count) from social media profile HTML. Reply with ONLY the number, no other text.",
        },
        {
          role: "user",
          content: `Platform: ${platform}

Rules:
- Find the total follower / subscriber / friend count for the profile.
- Expand abbreviations: "12.4K" → 12400, "2.5M" → 2500000, "1.2B" → 1200000000.
- If no profile or no follower count visible, reply: 0
- Reply with ONLY the integer.

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
