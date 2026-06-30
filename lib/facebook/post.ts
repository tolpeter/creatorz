import "server-only";

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Poszt a Creatorz Facebook-oldalra a Graph API-n keresztül. Best-effort:
 * hibánál sosem dob, csak { posted:false, error } értéket ad vissza.
 *
 * Szükséges env:
 *   FB_PAGE_ID            — a Facebook-oldal azonosítója
 *   FB_PAGE_ACCESS_TOKEN  — hosszú élettartamú Page Access Token (pages_manage_posts)
 *
 * Ha van imageUrl, FOTÓ-posztot készít (a kép a poszt teteje, a szöveg a felirat).
 * Egyébként sima feed-poszt linkkel (a Facebook OG-előnézetet tesz alá).
 */
export async function postToFacebookPage(opts: {
  message: string;
  link?: string;
  imageUrl?: string | null;
}): Promise<{ posted: boolean; id?: string; error?: string }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    return { posted: false, error: "FB_PAGE_ID vagy FB_PAGE_ACCESS_TOKEN hiányzik" };
  }

  try {
    const useImage = Boolean(opts.imageUrl);
    const endpoint = `${GRAPH}/${pageId}/${useImage ? "photos" : "feed"}`;
    const body = new URLSearchParams();
    body.set("access_token", token);
    if (useImage) {
      // Fotó-poszt: a link a feliratban kattintható.
      body.set("url", opts.imageUrl!);
      const caption = opts.link ? `${opts.message}\n\n${opts.link}` : opts.message;
      body.set("caption", caption);
    } else {
      body.set("message", opts.message);
      if (opts.link) body.set("link", opts.link);
    }

    const res = await fetch(endpoint, { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      post_id?: string;
      error?: { message?: string };
    };
    if (!res.ok || json.error) {
      return { posted: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { posted: true, id: json.post_id || json.id };
  } catch (e) {
    return { posted: false, error: (e as Error).message };
  }
}
