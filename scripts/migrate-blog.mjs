// Egyszeri migráció: blog_posts tábla + "blog" storage bucket.
// Futtatás:  node --env-file=.env.local scripts/migrate-blog.mjs
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

try {
  await sql`DO $$ BEGIN
    CREATE TYPE blog_status AS ENUM ('draft','published');
  EXCEPTION WHEN duplicate_object THEN null; END $$;`;

  await sql`CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(220) NOT NULL UNIQUE,
    title text NOT NULL,
    meta_title text,
    meta_description text,
    excerpt text,
    cover_url text,
    cover_alt text,
    content jsonb NOT NULL DEFAULT '[]'::jsonb,
    faq jsonb DEFAULT '[]'::jsonb,
    keywords jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    topic text,
    read_minutes integer NOT NULL DEFAULT 4,
    views integer NOT NULL DEFAULT 0,
    status blog_status NOT NULL DEFAULT 'published',
    ai_generated boolean NOT NULL DEFAULT true,
    published_at timestamp DEFAULT now(),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status, published_at)`;
  console.log("✓ blog_posts tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}

// Storage bucket
try {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.storage.createBucket("blog", {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("Bucket hiba:", error.message);
  } else {
    console.log("✓ 'blog' bucket kész");
  }
} catch (e) {
  console.error("Bucket kivétel:", e.message);
}
