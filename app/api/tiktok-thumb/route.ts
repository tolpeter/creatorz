import { getTikTokEmbed } from "@/lib/utils/oembed";

/**
 * TikTok thumbnail-proxy.
 *
 * Miért kell: a TikTok oEmbed thumbnail URL-jei aláírtak (`x-expires`) ÉS
 * hotlink-védettek — ezért a böngészőből közvetlenül beágyazva gyakran lejárnak
 * vagy 403-at adnak ("sokszor nem tölti be az előképet"). Ez a proxy:
 *   1) friss oEmbedből veszi a (nem lejárt) thumbnail URL-t,
 *   2) szerver-oldalon tölti le TikTok referer-rel (a hotlink-védelem nem gátol),
 *   3) a SAJÁT domainről, hosszan cache-elve szolgálja ki (élen is, s-maxage).
 * Így a meglévő videókra is működik, migráció nélkül, és az oEmbedet ritkán
 * hívja (a kép élen cache-elt), ami a Vercel-IP rate-limitet is kivédi.
 *
 *   GET /api/tiktok-thumb?u=<tiktok-video-url>&fb=<korábban-tárolt-thumb-url>
 */

// Csak TikTok CDN hostokról töltünk le (SSRF-védelem).
const ALLOWED_THUMB_HOST =
  /(^|\.)(tiktokcdn(-us|-eu)?\.com|tiktok\.com|ibyteimg\.com|muscdn\.com|bytecdn\.com)$/i;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const u = sp.get("u");
  const fb = sp.get("fb");

  if (!u || !/^https:\/\/([a-z0-9-]+\.)*tiktok\.com\//i.test(u)) {
    return new Response("Bad request", { status: 400 });
  }

  // Friss oEmbed → aktuális (nem lejárt) thumbnail URL.
  const embed = await getTikTokEmbed(u);
  let thumb = embed?.thumbnail_url ?? null;

  // Fallback: a portfólió-elemnél korábban tárolt thumbnail (ha az oEmbed most nem ad).
  if (!thumb && fb && /^https:\/\//i.test(fb)) thumb = fb;
  if (!thumb) return new Response("No thumbnail", { status: 404 });

  let host: string;
  try {
    host = new URL(thumb).hostname;
  } catch {
    return new Response("Bad thumbnail", { status: 400 });
  }
  if (!ALLOWED_THUMB_HOST.test(host)) {
    return new Response("Forbidden host", { status: 403 });
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(thumb, {
      headers: {
        "User-Agent": BROWSER_UA,
        Referer: "https://www.tiktok.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      next: { revalidate: 604800 },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
  if (!imgRes.ok) return new Response("Upstream error", { status: 502 });

  const buf = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
  return new Response(buf, {
    headers: {
      "Content-Type": contentType,
      // Élen 7 napig, böngészőben 1 napig; közben stale-while-revalidate.
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
