// A Creatorz play-ikon (lime gyuru + feher play + also feny) legeneralasa
// minden szukseges meretben: app/icon.png, app/apple-icon.png, app/favicon.ico
// es public/creatorz-icon.png (ezt kuldd be a TikTok-nak is, hogy egyezzen).
//   node scripts/gen-icon.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="#1b1b1b"/>
      <stop offset="60%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#050505"/>
    </radialGradient>
    <linearGradient id="lime" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bdf24a"/>
      <stop offset="55%" stop-color="#a3e635"/>
      <stop offset="100%" stop-color="#83c91f"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>

  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- also feny-talp -->
  <ellipse cx="256" cy="446" rx="150" ry="20" fill="#a3e635" opacity="0.55" filter="url(#softglow)"/>

  <!-- kulso lime gyuru, glow-val -->
  <circle cx="256" cy="244" r="158" fill="none" stroke="url(#lime)" stroke-width="46" filter="url(#glow)"/>

  <!-- belso sotet korong -->
  <circle cx="256" cy="244" r="116" fill="#1f1f1f"/>

  <!-- feher play haromszog (lekerekitett sarkok) -->
  <path d="M222 178 L330 238 Q344 246 330 254 L222 314 Q210 320 210 306 L210 186 Q210 172 222 178 Z" fill="#ffffff"/>
</svg>`;

const root = path.resolve(".");
const svgBuf = Buffer.from(SVG);

function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // width 0 => 256
  entry.writeUInt8(0, 1); // height 0 => 256
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // offset
  return Buffer.concat([header, entry, png]);
}

async function render(size) {
  return sharp(svgBuf).resize(size, size).png().toBuffer();
}

const icon512 = await render(512);
fs.writeFileSync(path.join(root, "app/icon.png"), icon512);
fs.writeFileSync(path.join(root, "public/creatorz-icon.png"), icon512);
fs.writeFileSync(path.join(root, "app/apple-icon.png"), await render(180));

const ico256 = await render(256);
fs.writeFileSync(path.join(root, "app/favicon.ico"), pngToIco(ico256));

// regi SVG ikon eltavolitasa, hogy ne legyen ket kulonbozo ikon
const oldSvg = path.join(root, "app/icon.svg");
if (fs.existsSync(oldSvg)) fs.rmSync(oldSvg);

console.log("Kesz: app/icon.png, app/apple-icon.png, app/favicon.ico, public/creatorz-icon.png");
