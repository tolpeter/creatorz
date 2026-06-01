/**
 * Best-effort TikTok follower scrape a nyilvános profil-oldalról.
 * Törékeny (a TikTok gyakran változtatja a markupot / blokkol), hibánál null.
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

    // Több lehetséges minta
    const match =
      html.match(/"followerCount":(\d+)/) ||
      html.match(/"stats":\{[^}]*"followerCount":(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  } catch {
    return null;
  }
}
