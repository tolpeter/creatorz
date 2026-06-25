// Diagnosztika + javítás: van-e "árva" Supabase Auth user (auth.users), aminek
// nincs public.users sora — ez blokkolja az újraregisztrációt ("már regisztrált").
//
// Megnézés:  node --env-file=.env.local scripts/check-orphan.mjs petratiktokon@gmail.com
// Törlés:    node --env-file=.env.local scripts/check-orphan.mjs petratiktokon@gmail.com --delete
//   (a --delete CSAK akkor töröl, ha tényleg árva: nincs hozzá app users sor)
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").trim().toLowerCase();
const DO_DELETE = process.argv.includes("--delete");
if (!email || email.startsWith("--")) {
  console.error("Adj meg egy email-t: node ... scripts/check-orphan.mjs valaki@gmail.com [--delete]");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const auth = await sql`
    SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
    FROM auth.users WHERE lower(email) = ${email}`;
  console.log(`\nAUTH.USERS (${auth.length}):`);
  console.log(auth);

  const pub = await sql`
    SELECT id, auth_id, email, role, created_at
    FROM public.users WHERE lower(email) = ${email}`;
  console.log(`\nPUBLIC.USERS (${pub.length}):`);
  console.log(pub);

  if (auth.length && pub.length === 0) {
    console.log("\n⚠️  ÁRVA AUTH-USER: létezik a Supabase Auth-ban, de NINCS app users sora.");
    console.log("    Ez okozza a 'már regisztrált' hibát.");
    if (DO_DELETE) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        console.error("    Hiányzó env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — nem tudok törölni.");
      } else {
        const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
        const { error } = await admin.auth.admin.deleteUser(auth[0].id);
        if (error) console.error("    ✗ Törlés hiba:", error.message);
        else console.log(`    ✓ Árva auth-user törölve (${auth[0].id}). Az email felszabadult — most már újra tud regisztrálni.`);
      }
    } else {
      console.log("    Felszabadításhoz futtasd újra a --delete kapcsolóval.");
    }
  } else if (auth.length && pub.length) {
    console.log("\nℹ️  Teljes fiók (auth + app sor is van).");
  } else if (!auth.length) {
    console.log("\n✅ Nincs ilyen email az auth.users-ben sem — más okból nem megy a regisztráció.");
  }
} catch (e) {
  console.error("HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
