/**
 * Admin reset + setup script — törli az ÖSSZES létező usert (auth + public),
 * és létrehoz egy ÚJ admin usert a megadott email-jelszóval.
 *
 * Használat:
 *   npx tsx scripts/setup-admin.mts <email> <password>
 *
 * Példa:
 *   npx tsx scripts/setup-admin.mts info@creatorz.hu MyStrongPass123
 *
 * Köv. env-változókat olvas a .env.local-ból (vagy a futtatási environment-ből):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL
 *
 * FIGYELEM: ez a script TÖRÖL MINDEN USERT! Csak akkor használd, ha biztosan
 * tiszta állapotba akarod állítani az adatbázist (pl. tesztelés után).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

config({ path: ".env.local" });

const [, , emailArg, passwordArg] = process.argv;
if (!emailArg || !passwordArg) {
  console.error("Használat: npx tsx scripts/setup-admin.mts <email> <password>");
  process.exit(1);
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!SUPA_URL || !SUPA_SERVICE || !DB_URL) {
  console.error("Hiányzó env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL");
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sql = postgres(DB_URL, { prepare: false });

async function main() {
  console.log("=== 1) Auth usereket lekérdezzük…");
  const { data: list, error: listErr } = await supa.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  console.log(`   talált: ${list.users.length} auth user`);

  console.log("\n=== 2) Auth usereket töröljük (mind)…");
  for (const u of list.users) {
    const { error } = await supa.auth.admin.deleteUser(u.id);
    if (error) {
      console.error(`   ❌ ${u.email}: ${error.message}`);
    } else {
      console.log(`   🗑️  ${u.email}`);
    }
  }

  console.log("\n=== 3) public DB-ből töröljük a kapcsolódó sorokat…");
  // Sorrend fontos: gyermek-táblákat előbb (FK miatt). Egy nagy TRUNCATE CASCADE
  // gyorsabb és tisztább, mint a táblánkénti DELETE.
  await sql.unsafe(`
    TRUNCATE TABLE
      ad_applications,
      ads,
      blog_posts,
      brand_profiles,
      brand_reviews,
      collaborations,
      contact_messages,
      creator_profiles,
      feature_purchases,
      messages,
      notifications,
      portfolio_items,
      profile_views,
      reports,
      review_responses,
      reviews,
      subscriptions,
      users
    RESTART IDENTITY CASCADE;
  `);
  console.log("   ✅ public táblák kiürítve");

  console.log("\n=== 4) Új admin user létrehozása az Auth-ban…");
  const { data: created, error: createErr } = await supa.auth.admin.createUser({
    email: emailArg,
    password: passwordArg,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  const authUser = created.user;
  if (!authUser) throw new Error("Az auth.user nem jött vissza");
  console.log(`   ✅ auth user létrehozva — id: ${authUser.id}`);

  console.log("\n=== 5) public.users sor + admin role…");
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO users (auth_id, email, role, email_verified)
    VALUES (${authUser.id}, ${emailArg}, 'admin', true)
    RETURNING id;
  `;
  console.log(`   ✅ users sor létrehozva — id: ${row.id}`);

  console.log("\n🎉 KÉSZ!");
  console.log(`   Admin email:   ${emailArg}`);
  console.log(`   Belépés:       https://creatorz.hu/login`);
  console.log(`   Admin panel:   https://creatorz.hu/admin`);
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error("\n❌ HIBA:", err);
    await sql.end();
    process.exit(1);
  });
