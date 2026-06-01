import { generateImage } from "../lib/replicate/client";
import fs from "fs/promises";
import path from "path";

type AR = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
const IMAGES: Array<{ name: string; prompt: string; aspectRatio: AR }> = [
  { name: "niche-fashion", prompt: "Young Hungarian fashion creator showcasing trendy outfit, mirror selfie at home, modern apartment, soft natural light, vibrant and stylish, lifestyle photography", aspectRatio: "4:3" },
  { name: "niche-home", prompt: "Modern minimalist living room interior with houseplants, clean Scandinavian style, soft daylight, cozy atmosphere, lifestyle photography", aspectRatio: "4:3" },
  { name: "niche-health", prompt: "Wellness flat lay with vitamins, water bottle, fresh fruit and yoga mat, soft natural light, healthy lifestyle, clean aesthetic, premium photography", aspectRatio: "4:3" },
  { name: "niche-travel", prompt: "Young Hungarian traveler at a scenic European cityscape, holding camera, golden hour light, vibrant travel photography, lifestyle aesthetic", aspectRatio: "4:3" },
  { name: "niche-pets", prompt: "Happy golden retriever dog being photographed with smartphone in a bright modern home, lifestyle pet content creation, natural light, warm cozy feel", aspectRatio: "4:3" },
  { name: "niche-beauty", prompt: "Close-up of cosmetic skincare products on marble surface, soft natural light, minimal aesthetic, premium beauty photography, modern Hungarian lifestyle, pastel tones", aspectRatio: "4:3" },
];

async function main() {
  const outputDir = path.join(process.cwd(), "public/images/generated");
  for (const [i, img] of IMAGES.entries()) {
    const target = path.join(outputDir, `${img.name}.webp`);
    try {
      // skip, ha már megvan és > 10kB (létező)
      const stat = await fs.stat(target).catch(() => null);
      if (stat && stat.size > 10000) {
        console.log(`[${i+1}/${IMAGES.length}] ${img.name} — már létezik, kihagyva`);
        continue;
      }
    } catch {}
    console.log(`[${i + 1}/${IMAGES.length}] ${img.name}`);
    try {
      const url = await generateImage(img.prompt, { aspectRatio: img.aspectRatio });
      const r = await fetch(url);
      const b = await r.arrayBuffer();
      await fs.writeFile(target, Buffer.from(b));
      console.log(`  ✓ ${img.name}.webp`);
    } catch (e) {
      console.error(`  ✗ ${img.name}:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 11000));
  }
  console.log("\n✓ Kész!");
}

main().catch(console.error);
