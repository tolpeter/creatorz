// Egyszeri Supabase Storage optimalizalo: a MAR feltoltott kepeket lekicsinyiti
// + webp/jpeg ujratomoriti + hosszu cache-control-t allit. Az utvonal (URL)
// VALTOZATLAN marad, igy a DB-ben tarolt hivatkozasok tovabbra is mukodnek.
// Cel: a Supabase "Cached Egress" csokkentese (ingyenes csomag alatt maradni).
//
//   Dry-run (csak jelent, semmit nem ir):
//     node --env-file=.env.local scripts/optimize-storage-images.mjs
//   Eles (tenylegesen atirja a fajlokat):
//     node --env-file=.env.local scripts/optimize-storage-images.mjs --apply
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Hianyzik a NEXT_PUBLIC_SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const LONG_CACHE = "31536000";
const BUCKETS = { avatars: 600, logos: 600, banners: 1600, portfolio: 1920 };
const IMG_EXT = /\.(jpe?g|png|webp)$/i;

const supa = createClient(URL, KEY, { auth: { persistSession: false } });
const kb = (n) => (n / 1024).toFixed(0) + " KB";

async function listAll(bucket, prefix = "", out = []) {
  const { data, error } = await supa.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) {
    console.error(`  list hiba (${bucket}/${prefix}):`, error.message);
    return out;
  }
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    // Mappa: nincs id/metadata -> rekurzio. Fajl: van metadata.
    if (item.id === null || item.metadata == null) {
      await listAll(bucket, path, out);
    } else {
      out.push({ path, size: item.metadata?.size ?? 0, mimetype: item.metadata?.mimetype });
    }
  }
  return out;
}

let totalBefore = 0;
let totalAfter = 0;
let optimized = 0;
let skipped = 0;

for (const [bucket, maxDim] of Object.entries(BUCKETS)) {
  console.log(`\n=== ${bucket} (max ${maxDim}px) ===`);
  const files = await listAll(bucket);
  const images = files.filter((f) => IMG_EXT.test(f.path));
  console.log(`  ${images.length} kep, osszesen ${kb(images.reduce((s, f) => s + f.size, 0))}`);

  for (const f of images) {
    totalBefore += f.size;
    try {
      const { data: blob, error: dErr } = await supa.storage.from(bucket).download(f.path);
      if (dErr || !blob) { skipped++; totalAfter += f.size; continue; }
      const input = Buffer.from(await blob.arrayBuffer());
      const ext = f.path.split(".").pop().toLowerCase();
      const isPng = ext === "png";
      const fmt = isPng ? "png" : ext === "webp" ? "webp" : "jpeg";

      let pipeline = sharp(input).rotate().resize(maxDim, maxDim, {
        fit: "inside",
        withoutEnlargement: true,
      });
      if (fmt === "jpeg") pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
      else if (fmt === "webp") pipeline = pipeline.webp({ quality: 80 });
      else pipeline = pipeline.png({ compressionLevel: 9, palette: true });

      const output = await pipeline.toBuffer();

      // Csak akkor irjuk vissza, ha legalabb 10%-ot sporolunk.
      if (output.length >= input.length * 0.9) {
        skipped++;
        totalAfter += input.length;
        continue;
      }

      if (APPLY) {
        const { error: uErr } = await supa.storage.from(bucket).upload(f.path, output, {
          upsert: true,
          cacheControl: LONG_CACHE,
          contentType: f.mimetype || `image/${fmt === "jpeg" ? "jpeg" : fmt}`,
        });
        if (uErr) { console.error(`  upload hiba ${f.path}:`, uErr.message); skipped++; totalAfter += input.length; continue; }
      }
      optimized++;
      totalAfter += output.length;
      if (optimized % 25 === 0) console.log(`  ...${optimized} optimalizalva`);
    } catch (e) {
      skipped++;
      totalAfter += f.size;
      console.error(`  hiba ${f.path}:`, e.message);
    }
  }
}

console.log("\n──────── OSSZEGZES ────────");
console.log(`Optimalizalt: ${optimized} | Kihagyott: ${skipped}`);
console.log(`Elotte:  ${kb(totalBefore)}`);
console.log(`Utana:   ${kb(totalAfter)}`);
const saved = totalBefore - totalAfter;
console.log(`Megtakaritas: ${kb(saved)} (${totalBefore ? Math.round((saved / totalBefore) * 100) : 0}%)`);
if (!APPLY) console.log("\nEz DRY-RUN volt (semmi nem irodott felul). Eles futtatas: add hozza a --apply kapcsolot.");
