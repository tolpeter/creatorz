import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const buckets = ["avatars", "banners", "portfolio", "logos"];

try {
  // Bucketök (publikus olvasás)
  for (const b of buckets) {
    await sql`insert into storage.buckets (id, name, public)
      values (${b}, ${b}, true) on conflict (id) do nothing`;
  }

  // RLS policy-k bucketönként (idempotens: drop + create)
  for (const b of buckets) {
    await sql.unsafe(`drop policy if exists "Public read ${b}" on storage.objects`);
    await sql.unsafe(
      `create policy "Public read ${b}" on storage.objects for select using (bucket_id = '${b}')`
    );
    await sql.unsafe(`drop policy if exists "Auth upload ${b}" on storage.objects`);
    await sql.unsafe(
      `create policy "Auth upload ${b}" on storage.objects for insert with check (bucket_id = '${b}' and auth.role() = 'authenticated')`
    );
    await sql.unsafe(`drop policy if exists "Own update ${b}" on storage.objects`);
    await sql.unsafe(
      `create policy "Own update ${b}" on storage.objects for update using (bucket_id = '${b}' and auth.uid()::text = (storage.foldername(name))[1])`
    );
    await sql.unsafe(`drop policy if exists "Own delete ${b}" on storage.objects`);
    await sql.unsafe(
      `create policy "Own delete ${b}" on storage.objects for delete using (bucket_id = '${b}' and auth.uid()::text = (storage.foldername(name))[1])`
    );
  }

  const rows = await sql`select id, public from storage.buckets order by id`;
  console.log("✅ Bucketök:", rows.map((r) => `${r.id}(public=${r.public})`).join(", "));
  const pol = await sql`select count(*)::int as n from pg_policies where schemaname='storage' and tablename='objects'`;
  console.log("✅ storage.objects policy-k száma:", pol[0].n);
} catch (e) {
  console.error("❌ HIBA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
