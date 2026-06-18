// Egyszeri migráció:
//  1) ads.slug oszlop + egyedi index (SEO-barát URL-ekhez), meglévők backfillje
//  2) a profile_views napi dedup index törlése (minden megtekintés számítson)
// Futtatás:  node --env-file=.env.local scripts/migrate-ad-slugs.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

function slugify(input) {
  const map = {
    á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u",
    Á: "a", É: "e", Í: "i", Ó: "o", Ö: "o", Ő: "o", Ú: "u", Ü: "u", Ű: "u",
  };
  return input
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .replace(/^-|-$/g, "");
}

try {
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS slug varchar(120)`;

  // Backfill: minden slug nélküli hirdetés kap egyedi slugot a címéből.
  const rows = await sql`SELECT id, title FROM ads WHERE slug IS NULL ORDER BY created_at`;
  const used = new Set(
    (await sql`SELECT slug FROM ads WHERE slug IS NOT NULL`).map((r) => r.slug),
  );
  let n = 0;
  for (const row of rows) {
    const base = slugify(row.title || "") || "hirdetes";
    let slug = base;
    let i = 2;
    while (used.has(slug)) slug = `${base}-${i++}`;
    used.add(slug);
    await sql`UPDATE ads SET slug = ${slug} WHERE id = ${row.id}`;
    n++;
  }

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_idx ON ads(slug)`;
  console.log(`✓ ads.slug kész — ${n} hirdetés backfillelve`);

  // A creator profil-megtekintés napi dedup index törlése: mostantól minden
  // megtekintés külön sor (5 megtekintés = 5).
  await sql`DROP INDEX IF EXISTS profile_views_unique_viewer_day_idx`;
  console.log("✓ profile_views napi dedup index törölve");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
