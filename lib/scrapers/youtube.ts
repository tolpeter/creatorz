/**
 * YouTube feliratkozók a hivatalos YouTube Data API v3-mal (ingyenes kvóta).
 * YOUTUBE_API_KEY env szükséges. Kezeli a /channel/ID és /@handle formákat.
 */
export async function fetchYouTubeSubscribers(channelUrl: string): Promise<number | null> {
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
