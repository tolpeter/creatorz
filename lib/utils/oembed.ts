export type TikTokEmbed = {
  html: string;
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
};

/** TikTok oEmbed — nem igényel API kulcsot. */
export async function getTikTokEmbed(url: string): Promise<TikTokEmbed | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as TikTokEmbed;
  } catch {
    return null;
  }
}

/** Instagram oEmbed — Meta Graph API token kell (V2). Most null. */
export async function getInstagramEmbed(url: string) {
  const accessToken = process.env.META_GRAPH_API_TOKEN;
  if (!accessToken) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(
        url
      )}&access_token=${accessToken}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
