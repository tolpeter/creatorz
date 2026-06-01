import { generateImage } from "../lib/replicate/client";
import fs from "fs/promises";
import path from "path";

type AR = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
const IMAGES: Array<{ name: string; prompt: string; aspectRatio: AR }> = [
  // HERO — mobil/TikTok inspired
  {
    name: "hero-phone",
    prompt:
      "Vertical smartphone screen showing a person filming a TikTok-style UGC video, holding the phone selfie-style, modern minimal aesthetic, soft natural lighting, lifestyle, depth of field, premium feel, photorealistic, dark background, neon green subtle accents",
    aspectRatio: "9:16",
  },
  // NICHES
  {
    name: "niche-beauty",
    prompt:
      "Close-up of cosmetic skincare products on marble surface, soft natural light, minimal aesthetic, premium beauty photography, modern Hungarian lifestyle, pastel tones",
    aspectRatio: "4:3",
  },
  {
    name: "niche-fashion",
    prompt:
      "Young Hungarian fashion creator showcasing trendy outfit, mirror selfie at home, modern apartment, soft natural light, vibrant and stylish, lifestyle photography",
    aspectRatio: "4:3",
  },
  {
    name: "niche-food",
    prompt:
      "Hand stirring fresh vegetables in a beautiful ceramic pan on modern stove, top-down food photography, kitchen aesthetic, colorful ingredients, premium look",
    aspectRatio: "4:3",
  },
  {
    name: "niche-home",
    prompt:
      "Modern minimalist living room interior with houseplants, clean Scandinavian style, soft daylight, cozy atmosphere, lifestyle photography",
    aspectRatio: "4:3",
  },
  {
    name: "niche-health",
    prompt:
      "Wellness flat lay with vitamins, water bottle, fresh fruit and yoga mat, soft natural light, healthy lifestyle, clean aesthetic, premium photography",
    aspectRatio: "4:3",
  },
  {
    name: "niche-baby",
    prompt:
      "Young Hungarian mother holding smiling baby in a bright modern nursery, candid lifestyle photography, soft natural light, warm tones",
    aspectRatio: "4:3",
  },
  {
    name: "niche-travel",
    prompt:
      "Young Hungarian traveler at a scenic European cityscape, holding camera, golden hour light, vibrant travel photography, lifestyle aesthetic",
    aspectRatio: "4:3",
  },
  {
    name: "niche-pets",
    prompt:
      "Happy golden retriever dog being photographed with smartphone in a bright modern home, lifestyle pet content creation, natural light, warm cozy feel",
    aspectRatio: "4:3",
  },
];

async function main() {
  const outputDir = path.join(process.cwd(), "public/images/generated");
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`Generating ${IMAGES.length} images...`);
  for (const [i, img] of IMAGES.entries()) {
    console.log(`[${i + 1}/${IMAGES.length}] ${img.name}`);
    try {
      const url = await generateImage(img.prompt, { aspectRatio: img.aspectRatio });
      const r = await fetch(url);
      const b = await r.arrayBuffer();
      await fs.writeFile(path.join(outputDir, `${img.name}.webp`), Buffer.from(b));
      console.log(`  ✓ ${img.name}.webp`);
    } catch (e) {
      console.error(`  ✗ ${img.name}:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log("\n✓ Kész!");
}

main().catch(console.error);
