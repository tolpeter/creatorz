import {
  extractFollowerCountAI,
  parseAbbreviatedCount,
} from "@/lib/ai/extract-followers";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * YouTube feliratkozók.
 * 1. Hivatalos YouTube Data API v3 (ha van YOUTUBE_API_KEY) — pontos.
 * 2. Fallback: a csatorna oldal HTML-jéből regex (magyar "ezer/E/millió" +
 *    angol "K/M") majd AI — így API-kulcs nélkül is működik.
 */
export async function fetchYouTubeSubscribers(
  channelUrl: string
): Promise<number | null> {
  const viaApi = await fetchViaApi(channelUrl);
  if (viaApi != null) return viaApi;
  return fetchViaHtml(channelUrl);
}

async function fetchViaApi(channelUrl: string): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  try {
    let param: string | null = null;
    const channelMatch = channelUrl.match(/youtube\.com\/channel\/(UC[\w-]+)/);
    const handleMatch = channelUrl.match(/youtube\.com\/@([\w.-]+)/);
    if (channelMatch) param = `id=${channelMatch[1]}`;
    else if (handleMatch) param = `forHandle=${handleMatch[1]}`;
    if (!param) return null;

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: Array<{ statistics?: { subscriberCount?: string } }>;
    };
    const count = data.items?.[0]?.statistics?.subscriberCount;
    return count ? parseInt(count, 10) : null;
  } catch {
    return null;
  }
}

async function fetchViaHtml(channelUrl: string): Promise<number | null> {
  try {
    // A /@handle, /channel/ID és /c/ formákat is kezeljük; a fő oldal jó.
    const res = await fetch(channelUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "hu-HU,hu;q=0.9,en;q=0.8" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1) Strukturált mező: "subscriberCountText" ... "606 ezer feliratkozó"
    const fromJson =
      html.match(/"subscriberCountText"[\s\S]{0,160}?"(?:simpleText|content|text)":"([^"]+)"/) ||
      null;
    if (fromJson) {
      const n = parseAbbreviatedCount(fromJson[1]);
      if (n) return n;
    }

    // 2) Általános szöveges minta: "606 ezer feliratkozó" / "606K subscribers"
    const loose = html.match(
      /([\d][\d.,\s]*\s*(?:ezer|millió|milliárd|E|M|B|K)?)\s*(?:feliratkozó|subscribers?)/i
    );
    if (loose) {
      const n = parseAbbreviatedCount(loose[1]);
      if (n) return n;
    }

    // 3) AI fallback a teljes HTML-en (kulcsszó köré centrált kivágással)
    return await extractFollowerCountAI("YouTube", html);
  } catch {
    return null;
  }
}
