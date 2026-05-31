import postgres from "postgres";

// Használat:
//   node --env-file=.env.local scripts/db-admin.mjs confirm <email>
//   node --env-file=.env.local scripts/db-admin.mjs delete <emailPrefixLike>
const [, , cmd, arg] = process.argv;
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  if (cmd === "confirm") {
    const r = await sql`update auth.users set email_confirmed_at = now()
      where email = ${arg} and email_confirmed_at is null returning id, email`;
    console.log("Megerősítve:", r);
  } else if (cmd === "delete") {
    const pattern = `${arg}%`;
    const pub = await sql`delete from public.users where email like ${pattern} returning email`;
    const auth = await sql`delete from auth.users where email like ${pattern} returning email`;
    console.log("Törölt public.users:", pub.map((x) => x.email));
    console.log("Törölt auth.users:", auth.map((x) => x.email));
  } else if (cmd === "show") {
    const r = await sql`select email, email_confirmed_at from auth.users where email like ${`${arg}%`}`;
    console.log(r);
  } else {
    console.log("Ismeretlen parancs:", cmd);
  }
} catch (e) {
  console.error("HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
