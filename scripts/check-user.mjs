import postgres from "postgres";

const email = process.argv[2];
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  const u = await sql`select id, auth_id, email, role, approved, created_at from users where email = ${email}`;
  console.log("users sorok:", u.length);
  console.log(u);
  if (u.length) {
    const cp = await sql`select id, user_id, username, display_name from creator_profiles where user_id = ${u[0].id}`;
    console.log("creator_profiles sorok:", cp.length);
    console.log(cp);
    const bp = await sql`select id, user_id, company_name from brand_profiles where user_id = ${u[0].id}`;
    console.log("brand_profiles sorok:", bp.length);
    console.log(bp);
  }
} catch (e) {
  console.error("HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
