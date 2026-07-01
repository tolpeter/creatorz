import "server-only";

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * A megadott tokenből a Page-specifikus access tokent állítja elő. Oldalra
 * posztolni Page Access Tokennel kell — a system-user / user token közvetlenül
 * (#200) hibát ad. A GET /{page}?fields=access_token visszaadja a page-tokent,
 * ha a token jogosult az oldalhoz. Ha nem sikerül (pl. már eleve page-token),
 * visszaadjuk az eredeti tokent.
 */
async function resolvePageToken(pageId: string, token: string): Promise<string> {
  try {
    const r = await fetch(
      `${GRAPH}/${pageId}?fields=access_token&access_token=${encodeURIComponent(token)}`,
    );
    const j = (await r.json().catch(() => ({}))) as { access_token?: string };
    if (j?.access_token) return j.access_token;
  } catch {
    // ignoráljuk — marad az eredeti token
  }
  return token;
}

/**
 * Poszt a Creatorz Facebook-oldalra a Graph API-n keresztül. Best-effort:
 * hibánál sosem dob, csak { posted:false, error } értéket ad vissza.
 *
 * Szükséges env:
 *   FB_PAGE_ID            — a Facebook-oldal azonosítója
 *   FB_PAGE_ACCESS_TOKEN  — Page Access Token VAGY system-user token (utóbbiból
 *                           automatikusan page-tokent állítunk elő).
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
  const rawToken = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !rawToken) {
    return { posted: false, error: "FB_PAGE_ID vagy FB_PAGE_ACCESS_TOKEN hiányzik" };
  }

  // Oldalra posztoláshoz page-token kell — a system-user tokent átváltjuk rá.
  const token = await resolvePageToken(pageId, rawToken);

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
