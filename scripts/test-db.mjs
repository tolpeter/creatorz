import postgres from "postgres";

const url = process.env.DATABASE_URL;
console.log("DATABASE_URL kezdete:", url?.slice(0, 30) + "...");

const sql = postgres(url, { prepare: false });

try {
  const r = await sql`select 1 as ok, current_database() as db, version() as version`;
  console.log("✅ Kapcsolat OK:", { ok: r[0].ok, db: r[0].db });
  console.log("PG:", r[0].version.split(" ").slice(0, 2).join(" "));
} catch (e) {
  console.error("❌ Kapcsolat HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
