/**
 * Default profilkép — a user által kért stílusban (neon lime sziluett-portré
 * sötét háttéren, play gomb-akcens). Olyan userek kapják, akik nem töltöttek
 * fel profilképet.
 * Futtatás: node --env-file=.env.local --import tsx scripts/generate-default-avatar.mts
 */
import { writeFileSync } from "node:fs";
import { generateImage } from "../lib/replicate/client";

const PROMPT = [
  "A pure black background, in the center: a glowing neon lime green (#A3E635)",
  "circular outline frame, inside the frame a centered silhouette of a person",
  "wearing a suit with a tie, the silhouette has a soft neon lime edge glow",
  "outlining the head and shoulders. On the right side of the circle there is a",
  "small triangular play button icon glowing in the same neon lime green.",
  "Modern minimalist neon icon style, perfectly symmetric and centered,",
  "1:1 square composition, isolated subject, no text, no letters, no words,",
  "no watermark, dramatic black background, crisp clean edges",
].join(" ");

const url = await generateImage(PROMPT, { aspectRatio: "1:1" });
const res = await fetch(url);
if (!res.ok) throw new Error(`Letöltés sikertelen: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync("public/images/default-avatar.webp", buf);
console.log("✓ public/images/default-avatar.webp", buf.length, "byte");
