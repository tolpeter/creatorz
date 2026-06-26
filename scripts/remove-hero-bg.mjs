// A hero-2 kepek vilagos (sakktabla) hatteret atlatszova teszi, ES a lagy
// arnyekot is eltavolitja (kulonben a telefon/kartya talpanal "zsebek"
// maradnak, amiket a szelrol indulo flood-fill nem er el). Vegul webp-be
// tomorit.
//
// Forras: public/images/home-hero-2/_raw/*.png  ->  kimenet: *.webp
// Futtatas:  node scripts/remove-hero-bg.mjs
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const DIR = path.resolve("public/images/home-hero-2");
const RAW = path.join(DIR, "_raw");
const FILES = [
  "phone",
  "card-influencer",
  "card-model",
  "card-photographer",
  "card-editor",
  "card-operator",
  "card-ugc",
];

// Hatter / lagy arnyek: vilagos ES alacsony telitettsegu (semleges szurke-feher).
// A min>=150 a kozepszurke arnyekot is befogja, igy a flood-fill atjut rajta es
// eleri az arnyek altal "elzart" sakktabla-zsebeket. A kartyan beluli feher
// szoveg nem er a szelig -> erintetlen marad.
const isBg = (r, g, b) => {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= 150 && max - min <= 26;
};

async function processFile(base) {
  const src = path.join(RAW, `${base}.png`);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const N = width * height;

  const removed = new Uint8Array(N);
  const queue = new Int32Array(N);
  let qh = 0,
    qt = 0;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (removed[p]) return;
    const o = p * channels;
    if (!isBg(data[o], data[o + 1], data[o + 2])) return;
    removed[p] = 1;
    queue[qt++] = p;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  // 8-szomszedos flood-fill
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % width;
    const y = (p - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
    push(x - 1, y - 1);
    push(x + 1, y - 1);
    push(x - 1, y + 1);
    push(x + 1, y + 1);
  }

  // Hatter alfa = 0
  for (let p = 0; p < N; p++) {
    if (removed[p]) data[p * channels + 3] = 0;
  }

  // Perem-lagyitas: a megtartott, vilagos, hatarolo pixelek felig atlatszok,
  // hogy ne maradjon eles vilagos szegely (halo).
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (removed[p]) continue;
      const o = p * channels;
      const min = Math.min(data[o], data[o + 1], data[o + 2]);
      const max = Math.max(data[o], data[o + 1], data[o + 2]);
      if (min < 140 || max - min > 40) continue; // csak vilagos-semleges peremet
      let near = 0;
      if (x > 0 && removed[p - 1]) near++;
      if (x < width - 1 && removed[p + 1]) near++;
      if (y > 0 && removed[p - width]) near++;
      if (y < height - 1 && removed[p + width]) near++;
      if (near >= 3) data[o + 3] = 0;
      else if (near === 2) data[o + 3] = 70;
      else if (near === 1) data[o + 3] = 150;
    }
  }

  const outFile = path.join(DIR, `${base}.webp`);
  await sharp(data, { raw: { width, height, channels } })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(outFile);
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`  ${base}.webp kesz (${kb} KB)`);
}

console.log("Hatter-eltavolitas + webp tomorites...");
for (const f of FILES) await processFile(f);
console.log("Kesz.");
