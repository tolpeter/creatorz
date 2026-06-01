/**
 * Best-effort Instagram follower scrape. Az Instagram aktívan blokkolja a
 * scrapelést, ezért gyakran null-t ad vissza — ilyenkor a manuális érték marad.
 * Megbízható megoldás: Meta Graph API (V2, OAuth + token).
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
    return match ? parseInt(match[1]!, 10) : null;
  } catch {
    return null;
  }
}
