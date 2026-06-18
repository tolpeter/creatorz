/**
 * Supabase Storage publikus kép-URL → FB-barát OG-kép URL.
 *
 * A feltöltött borítók/logók gyakran WebP-ek, amit a Facebook NEM jelenít meg
 * link-előnézetként. A Supabase render-végpontja viszont JPEG-et ad vissza és
 * át is méretezi a képet, így a megosztásnál megjelenik az előkép.
 *
 * Csak a Supabase `/storage/v1/object/public/` URL-eket alakítja át; minden
 * mást (pl. a statikus `/og-image.png`-et) változatlanul visszaad.
 */
export function supabaseOgImage(
  url: string,
  opts?: { width?: number; height?: number; resize?: "cover" | "contain" | "fill" },
): string {
  const marker = "/storage/v1/object/public/";
  if (!url.includes(marker)) return url;

  const rendered = url.replace(marker, "/storage/v1/render/image/public/");
  const params = new URLSearchParams();
  if (opts?.width) params.set("width", String(opts.width));
  if (opts?.height) params.set("height", String(opts.height));
  if (opts?.resize) params.set("resize", opts.resize);
  params.set("quality", "80");
  return `${rendered}?${params.toString()}`;
}
