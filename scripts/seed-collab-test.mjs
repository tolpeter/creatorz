// ───────────────────────────────────────────────────────────────────────────
// TESZT együttműködés seed — élesben kipróbálható mindkét oldalról.
//
// Létrehoz (idempotens, újrafuttatható):
//   • teszt MÁRKA fiókot      →  teszt-marka@creatorz.hu  / Teszt1234
//   • teszt TARTALOMGYÁRTÓT   →  teszt-alkoto@creatorz.hu / Teszt1234
//   • egy aktív kampányt (a márkáé)
//   • egy ELFOGADOTT pályázatot (az alkotóé)
//   • egy ÉLŐ együttműködést a kettő között (a "Megállapodás" fázistól indul)
//
// Utána két böngészőben (vagy egy normál + egy inkognitó) belépsz a két
// fiókkal, és végigkattintod a teljes folyamatot:
//   márka: megállapodást javasol → ... → leadás után jóváhagy / változtatást kér
//   alkotó: elfogadja a megállapodást → linket ad → lead → (javít) → értékel
//
// Futtatás:
//   node --env-file=.env.local scripts/seed-collab-test.mjs
//
// Törlés (a teszt-fiókok + minden kapcsolódó adat eltávolítása):
//   node --env-file=.env.local scripts/seed-collab-test.mjs --reset
// ───────────────────────────────────────────────────────────────────────────
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const RESET = process.argv.includes("--reset");

const BRAND_EMAIL = "teszt-marka@creatorz.hu";
const CREATOR_EMAIL = "teszt-alkoto@creatorz.hu";
const PASSWORD = "Teszt1234";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supaUrl || !serviceKey || !process.env.DATABASE_URL) {
  console.error(
    "Hiányzó env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL",
  );
  process.exit(1);
}

const admin = createClient(supaUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

/** Auth-user törlése email alapján (ha létezik). */
async function deleteAuthUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);
}

/** A teszt-adatok teljes törlése (DB-cascade + auth-userek). */
async function cleanup() {
  // A users sor törlése cascade-del viszi a profilt, a kampányt, a pályázatot,
  // az együttműködést, a leadott linkeket és az eseményeket is.
  await sql`DELETE FROM users WHERE email IN (${BRAND_EMAIL}, ${CREATOR_EMAIL})`;
  await deleteAuthUser(BRAND_EMAIL);
  await deleteAuthUser(CREATOR_EMAIL);
}

/** Auth-user létrehozása + users sor (megerősített email, belépésre kész). */
async function createUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  const [row] = await sql`
    INSERT INTO users (auth_id, email, role, approved, email_verified)
    VALUES (${data.user.id}, ${email}, ${role}, true, true)
    RETURNING id
  `;
  return row.id;
}

async function main() {
  // Mindig tiszta lappal indítunk (idempotens).
  await cleanup();
  if (RESET) {
    console.log("🧹 Teszt-fiókok és kapcsolódó adatok törölve.");
    return;
  }

  // ── MÁRKA ────────────────────────────────────────────────────────────────
  const brandUserId = await createUser(BRAND_EMAIL, "brand");
  const [brand] = await sql`
    INSERT INTO brand_profiles (user_id, company_name, website_url, contact_name, industry, description)
    VALUES (${brandUserId}, ${"Teszt Márka Kft. (DEMO)"}, ${"https://teszt-marka.hu"},
            ${"Teszt Béla"}, ${"Szépségápolás"}, ${"Demó márka az együttműködés-folyamat teszteléséhez."})
    RETURNING id
  `;
  const brandId = brand.id;

  // ── TARTALOMGYÁRTÓ ─────────────────────────────────────────────────────────
  const creatorUserId = await createUser(CREATOR_EMAIL, "creator");
  const [creator] = await sql`
    INSERT INTO creator_profiles (user_id, username, display_name, bio, city, county, age, gender, avatar_url)
    VALUES (${creatorUserId}, ${"teszt-alkoto"}, ${"Teszt Alkotó (DEMO)"},
            ${"Demó tartalomgyártó az együttműködés-folyamat teszteléséhez."},
            ${"Budapest"}, ${"Budapest"}, ${26}, ${"no"},
            ${"https://picsum.photos/seed/tesztalkoto/200/200"})
    RETURNING id
  `;
  const creatorId = creator.id;

  // ── KAMPÁNY (a márkáé, aktív) ──────────────────────────────────────────────
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 1);
  const [ad] = await sql`
    INSERT INTO ads (brand_id, title, description, content_type, item_count, deadline, usage_rights, status, approved_at, seeking_count)
    VALUES (${brandId}, ${"DEMO: Nyári termékbemutató reel"},
            ${"Keresünk egy pörgős, organikus stílusú 9:16-os reelt a nyári termékünkről. Ez egy DEMÓ kampány a folyamat teszteléséhez."},
            ${"video"}, ${1}, ${deadline}, ${"Organikus + fizetett hirdetés (1 év)"}, ${"active"}, ${new Date()}, ${"one"})
    RETURNING id
  `;
  const adId = ad.id;

  // ── PÁLYÁZAT (az alkotóé, ELFOGADVA) ───────────────────────────────────────
  const [appRow] = await sql`
    INSERT INTO ad_applications (ad_id, creator_id, message, status, responded_at)
    VALUES (${adId}, ${creatorId}, ${"Szia! Szívesen elkészíteném a reelt, van tapasztalatom termékvideókban."}, ${"accepted"}, ${new Date()})
    RETURNING id
  `;
  const applicationId = appRow.id;

  // ── EGYÜTTMŰKÖDÉS (élő, a Megállapodás fázistól) ───────────────────────────
  const [collab] = await sql`
    INSERT INTO collaborations (ad_id, application_id, brand_id, creator_id, status)
    VALUES (${adId}, ${applicationId}, ${brandId}, ${creatorId}, ${"active"})
    RETURNING id
  `;
  const collabId = collab.id;

  console.log("\n✅ Teszt együttműködés készen áll!\n");
  console.log("  MÁRKA fiók");
  console.log(`    Email:    ${BRAND_EMAIL}`);
  console.log(`    Jelszó:   ${PASSWORD}`);
  console.log(`    Workspace: ${APP_URL}/brand/collaborations/${collabId}`);
  console.log("");
  console.log("  TARTALOMGYÁRTÓ fiók");
  console.log(`    Email:    ${CREATOR_EMAIL}`);
  console.log(`    Jelszó:   ${PASSWORD}`);
  console.log(`    Workspace: ${APP_URL}/creator/collaborations/${collabId}`);
  console.log("");
  console.log("  Tipp: az egyik fiókkal normál böngészőben, a másikkal inkognitóban");
  console.log("  lépj be, így párhuzamosan látod mindkét oldalt.\n");
  console.log("  Teljes törlés:  node --env-file=.env.local scripts/seed-collab-test.mjs --reset\n");
}

main()
  .catch((e) => {
    console.error("❌ HIBA:", e.message);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
