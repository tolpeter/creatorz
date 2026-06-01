import { generateImage } from "../lib/replicate/client";
import fs from "fs/promises";
import path from "path";

type AR = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
const IMAGES: Array<{ name: string; prompt: string; aspectRatio: AR }> = [
  {
    name: "hero-bg",
    prompt:
      "Modern minimalist abstract dark background, glowing neon green particles flowing diagonally, deep black gradient, cinematic, 4k quality, atmospheric, digital art, slight green vignette in corners",
    aspectRatio: "16:9",
  },
  {
    name: "feature-creator",
    prompt:
      "Young confident Hungarian content creator with smartphone filming a TikTok video, modern bright apartment, natural light, soft focus background, lifestyle photography, vibrant colors, professional shot",
    aspectRatio: "4:3",
  },
  {
    name: "feature-brand",
    prompt:
      "Modern Hungarian e-commerce startup team in a bright office, looking at marketing dashboard on large screen, professional but casual atmosphere, diverse team, soft natural light, professional photography",
    aspectRatio: "4:3",
  },
  {
    name: "feature-collaboration",
    prompt:
      "Two professionals (one creator with camera, one brand manager with laptop) high-fiving over a coffee table in a bright modern cafe, success moment, candid lifestyle photography",
    aspectRatio: "4:3",
  },
  {
    name: "og-image",
    prompt:
      "Modern minimalist banner design, deep black background with neon lime green geometric shapes, large bold sans-serif text 'CREATORZ', subtle particle effects, premium feel, digital art",
    aspectRatio: "16:9",
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
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(path.join(outputDir, `${img.name}.webp`), Buffer.from(buffer));
      console.log(`  ✓ ${img.name}.webp`);
    } catch (err) {
      console.error(`  ✗ ${img.name}`, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("\n✓ Kész!");
}

main().catch(console.error);
