// Egyszeri seed: a "Creatorz.hu" sajat markaprofil letrehozasa, hogy az admin
// a sajat platform neveben adhasson fel hirdetest (/admin/ads/new -> Creatorz.hu).
//
// A markat egy dedikalt rendszer-userhez kotjuk (role=brand), NEM az admin sajat
// userehez, igy az admin szerepkore valtozatlan marad. Ez a user nem jelentkezik
// be sehol; az admin a hirdetest az admin panelbol adja fel a neveben.
//
// Idempotens: ha mar letezik, nem hoz letre masodikat, csak kiirja az ID-t.
//
// Futtatas:  node --env-file=.env.local scripts/seed-creatorz-brand.mjs
import postgres from "postgres";

const BRAND_NAME = "Creatorz.hu";
const BRAND_EMAIL = "hirdetes@creatorz.hu"; // rendszer-cim; ide mennek a palyazat-ertesitok
const WEBSITE = "https://creatorz.hu";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  // 1. Mar letezik a marka? (nev alapjan)
  const existing = await sql`
    SELECT id, user_id FROM brand_profiles WHERE company_name = ${BRAND_NAME} LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`✓ "${BRAND_NAME}" marka mar letezik. brand_id = ${existing[0].id}`);
    process.exit(0);
  }

  // 2. Rendszer-user (role=brand). Email alapjan idempotens.
  let userRows = await sql`SELECT id FROM users WHERE email = ${BRAND_EMAIL} LIMIT 1`;
  if (userRows.length === 0) {
    userRows = await sql`
      INSERT INTO users (auth_id, email, role, approved, email_verified)
      VALUES (gen_random_uuid(), ${BRAND_EMAIL}, 'brand', true, true)
      RETURNING id
    `;
    console.log(`  + rendszer-user letrehozva (${BRAND_EMAIL})`);
  } else {
    console.log(`  = rendszer-user mar megvolt (${BRAND_EMAIL})`);
  }
  const userId = userRows[0].id;

  // 3. Markaprofil
  const brand = await sql`
    INSERT INTO brand_profiles (user_id, company_name, website_url, description)
    VALUES (
      ${userId},
      ${BRAND_NAME},
      ${WEBSITE},
      ${"A Creatorz.hu hivatalos profilja - a magyar UGC, influencer es modell piacter."}
    )
    RETURNING id
  `;
  console.log(`✓ "${BRAND_NAME}" marka letrehozva. brand_id = ${brand[0].id}`);
  console.log("  Most mar kivalaszthato itt: /admin/ads/new");
} catch (e) {
  console.error("DB hiba:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
