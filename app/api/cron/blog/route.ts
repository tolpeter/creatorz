import { generateAndPublishPost } from "@/lib/blog/generate";

// Az AI-generálás + képkészítés tovább tart, mint a default 10s.
export const maxDuration = 300;

/**
 * Heti automatikus blog-generálás. A vercel.json hetente kétszer hívja
 * (hétfő + csütörtök). Hívásonként 2 SEO-bejegyzést készít és publikál.
 * Manuális indítás: GET /api/cron/blog?count=1  (Bearer CRON_SECRET fejléccel).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const count = Math.min(3, Math.max(1, Number(url.searchParams.get("count")) || 2));

  const results: { slug: string; title: string }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      results.push(await generateAndPublishPost());
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return Response.json({ created: results.length, posts: results, errors });
}
