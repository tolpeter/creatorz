import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  const rows = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  console.log("Public táblák (", rows.length, "):");
  console.log(rows.map((r) => r.table_name).join(", "));
} catch (e) {
  console.error("HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
