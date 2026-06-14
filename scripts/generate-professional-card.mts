/**
 * A regisztrációs oldal 3. (kreatív szakember) kártyájának háttérképe.
 * Stílus: a meglévő register-creator/register-brand kártyákhoz igazítva —
 * világos krém háttér, neon-lime (#A3E635) akcentek, jobb oldali eszköz-kollázs,
 * BAL oldal üresen hagyva (oda kerül az élő HTML felirat).
 * Futtatás:  node --env-file=.env.local --import tsx scripts/generate-professional-card.mts
 */
import { writeFileSync } from "node:fs";
import { generateImage } from "../lib/replicate/client";

const PROMPT = [
  "Clean modern marketing card illustration on pure white background with very subtle",
  "lime green gradient glow in the bottom right corner.",
  "Composition: ALL objects grouped in the RIGHT HALF of the frame only —",
  "a floating collage of a professional cinema camera, a photo camera with big lens,",
  "and a laptop showing a video editing timeline with bright lime green (#A3E635) clips,",
  "plus one small floating rounded UI card with a lime green play button icon.",
  "The ENTIRE LEFT HALF is empty clean white space, completely free of any objects.",
  "Soft drop shadows under objects, 3D product render aesthetic, high key studio lighting,",
  "no people, no text, no letters, no words, no watermark",
].join(" ");

const url = await generateImage(PROMPT, { aspectRatio: "4:3" });
const res = await fetch(url);
if (!res.ok) throw new Error(`Letöltés sikertelen: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync("public/images/register-professional.webp", buf);
console.log("✓ public/images/register-professional.webp", buf.length, "byte");
