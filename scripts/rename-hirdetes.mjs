// Egyszeri szöveg-átnevezés: "hirdetés" -> "kampány" a felhasználói szövegekben.
// Magyar toldalék-helyesség: pontos szóalak-párok, hossz szerint csökkenőben
// alkalmazva (a hosszabb alak előbb, hogy a prefixek ne ütközzenek).
// A "hirdeti" (ige) és a "hirdetes" (ékezet nélküli) NEM változik.
// Futtatás:  node scripts/rename-hirdetes.mjs
import fs from "fs";
import path from "path";

const pairs = [
  ["Hirdetésfeladáshoz", "Kampányfeladáshoz"],
  ["hirdetésfeladáshoz", "kampányfeladáshoz"],
  ["hirdetésfeladásnál", "kampányfeladásnál"],
  ["hirdetésleírásokhoz", "kampányleírásokhoz"],
  ["Hirdetésfeladás", "Kampányfeladás"],
  ["hirdetésfeladás", "kampányfeladás"],
  ["hirdetéseidben", "kampányaidban"],
  ["hirdetéseiből", "kampányaiból"],
  ["hirdetéseiden", "kampányaidon"],
  ["hirdetésednél", "kampányodnál"],
  ["hirdetésenként", "kampányonként"],
  ["hirdetésekhez", "kampányokhoz"],
  ["hirdetésedre", "kampányodra"],
  ["hirdetéseket", "kampányokat"],
  ["hirdetésekre", "kampányokra"],
  ["hirdetéseire", "kampányaira"],
  ["hirdetéseit", "kampányait"],
  ["hirdetéseid", "kampányaid"],
  ["hirdetései", "kampányai"],
  ["hirdetését", "kampányát"],
  ["hirdetésére", "kampányára"],
  ["hirdetésnél", "kampánynál"],
  ["hirdetéshez", "kampányhoz"],
  ["hirdetésben", "kampányban"],
  ["Hirdetéseim", "Kampányaim"],
  ["hirdetéseim", "kampányaim"],
  ["Hirdetések", "Kampányok"],
  ["hirdetések", "kampányok"],
  ["Hirdetésem", "Kampányom"],
  ["hirdetésre", "kampányra"],
  ["hirdetésen", "kampányon"],
  ["hirdetésed", "kampányod"],
  ["hirdetése", "kampánya"],
  ["hirdetést", "kampányt"],
  ["hirdetési", "kampány"],
  ["Hirdetés", "Kampány"],
  ["hirdetés", "kampány"],
].sort((a, b) => b[0].length - a[0].length);

// Biztonságos fájlkör: minden .tsx UI + a felhasználó-facing .ts szövegek.
// KIMARAD: lib/constants.ts ("fizetett hirdetés" = usage-right, más jelentés),
// lib/analytics, lib/db/schema.ts, lib/settings.ts, lib/ai, lib/blog, lib/utils.
const includeDirs = ["app", "components", "mobile", "lib/email"];
const exts = new Set([".tsx", ".ts"]);

let count = 0;
const touched = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(path.extname(e.name))) {
      const orig = fs.readFileSync(p, "utf8");
      let s = orig;
      for (const [a, b] of pairs) if (s.includes(a)) s = s.split(a).join(b);
      if (s !== orig) {
        fs.writeFileSync(p, s);
        touched.push(p);
        count++;
      }
    }
  }
}

for (const d of includeDirs) if (fs.existsSync(d)) walk(d);
console.log(touched.join("\n"));
console.log(`\n✓ ${count} fájl átírva (hirdetés -> kampány)`);
