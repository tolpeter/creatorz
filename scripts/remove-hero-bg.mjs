// A hero-2 kepek vilagos (sakktabla) hatteret atlatszova teszi.
// A szelekrol indulo flood-fill csak a kartyan KIVULI vilagos hatteret tavolitja
// el; a kartyan beluli feher szoveg (nem er a szelig) erintetlen marad.
// A gyurut (ring.png) NEM bantjuk -> CSS mix-blend-screen kezeli.
//
// Futtatas:  node scripts/remove-hero-bg.mjs
import sharp from "sharp";
import path from "node:path";

const DIR = path.resolve("public/images/home-hero-2");
const RAW = path.join(DIR, "_raw");
const FILES = [
  "phone.png",
  "card-influencer.png",
  "card-model.png",
  "card-photographer.png",
  "card-editor.png",
  "card-operator.png",
  "card-ugc.png",
];

// Vilagos, semleges (szurkes-feher) hatter-e a pixel?
const isBg = (r, g, b) => {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= 224 && max - min <= 16;
};

async function processFile(name) {
  const src = path.join(RAW, name);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels = 4
  const idx = (x, y) => (y * width + x) * channels;

  const removed = new Uint8Array(width * height); // 1 = hatter
  const queue = new Int32Array(width * height);
  let qh = 0,
    qt = 0;

  const push = (x, y) => {
    const p = y * width + x;
    if (removed[p]) return;
    const o = p * channels;
    if (!isBg(data[o], data[o + 1], data[o + 2])) return;
    removed[p] = 1;
    queue[qt++] = p;
  };

  // Minden szelpixel beoltasa
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  // BFS (4-szomszed)
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  // Alfa nullazas a hatterre + 1px lagyitas a peremen
  for (let p = 0; p < width * height; p++) {
    if (removed[p]) {
      data[p * channels + 3] = 0;
    }
  }
  // Feather: megtartott, de hatterre hatarolo, vilagos pixelek felig atlatszok
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (removed[p]) continue;
      const o = p * channels;
      const min = Math.min(data[o], data[o + 1], data[o + 2]);
      if (min < 210) continue; // csak vilagos peremet lagyitunk
      let near = 0;
      if (x > 0 && removed[p - 1]) near++;
      if (x < width - 1 && removed[p + 1]) near++;
      if (y > 0 && removed[p - width]) near++;
      if (y < height - 1 && removed[p + width]) near++;
      if (near >= 2) data[o + 3] = 90;
      else if (near === 1) data[o + 3] = 160;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(path.join(DIR, name));
  const kept = width * height - removed.reduce((s, v) => s + v, 0);
  console.log(`  ${name}: hatter eltavolitva (${kept} pixel megtartva)`);
}

console.log("Hatter-eltavolitas...");
for (const f of FILES) await processFile(f);
console.log("Kesz.");
