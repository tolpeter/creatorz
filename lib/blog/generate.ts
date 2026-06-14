import "server-only";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/replicate/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { BLOG_TOPICS } from "@/lib/blog/topics";
import type { GeneratedPost, BlogBlock, BlogFaq } from "@/lib/blog/types";

const MODEL = process.env.BLOG_AI_MODEL || "gpt-4o-mini";

/** Ékezetes magyar cím → URL-barát slug. */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u",
    Á: "a", É: "e", Í: "i", Ó: "o", Ö: "o", Ő: "o", Ú: "u", Ü: "u", Ű: "u",
  };
  return input
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || `bejegyzes-${Date.now()}`;
  let i = 2;
  // ütközés esetén -2, -3, ...
  while (
    (await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug))).length > 0
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

const SYSTEM_PROMPT = `Te a Creatorz (creatorz.hu) tartalomstratégája vagy. A Creatorz egy magyar UGC (felhasználó által készített tartalom) piactér, amely összeköti a tartalomgyártókat és a márkákat.
A feladatod: ÍRJ EGY KIVÁLÓ, SEO-RA OPTIMALIZÁLT, MAGYAR NYELVŰ BLOGBEJEGYZÉST.

Követelmények:
- 700–1100 szó, közérthető, gyakorlatias, valódi értéket adó tartalom (NEM töltelékszöveg).
- Logikus felépítés: bevezető, több H2 szekció (esetenként H3), felsorolások, egy kiemelt idézet, és egy záró összegzés.
- SEO: a fő kulcsszó szerepeljen a címben, a meta címben, a bevezetőben és néhány alcímben természetesen.
- BELSŐ LINKEK: szőj a szövegbe 3–5 belső linket markdown formában a következő oldalakra, releváns horgonyszöveggel:
  [tartalomgyártók böngészése](/creators), [hirdetések és briefek](/ads), [ingyenes regisztráció](/register), [GYIK](/gyik), [kapcsolat](/kapcsolat).
- KÜLSŐ LINKEK: 2–3 hiteles külső forrásra mutató link markdown formában (pl. iparági statisztika, Google/Meta hivatalos blog, ismert szakmai oldal). Valós, jól ismert domaineket használj (pl. https://www.thinkwithgoogle.com, https://blog.hootsuite.com, https://www.statista.com).
- A linkeket KIZÁRÓLAG a "p" típusú blokkok "text" mezőjébe tedd, markdown [címke](url) formában. Félkövérhez **csillagok**.
- Adj 3 elemű FAQ-ot (gyakori kérdés + tömör válasz) a témához.

VÁLASZ FORMÁTUM: KIZÁRÓLAG érvényes JSON, pontosan ez a séma:
{
  "title": "string (max ~65 karakter)",
  "metaTitle": "string (max 60 karakter)",
  "metaDescription": "string (140-160 karakter)",
  "excerpt": "string (1-2 mondatos összefoglaló)",
  "keywords": ["string", ...5-8 db],
  "tags": ["string", ...2-4 db rövid címke],
  "coverPrompt": "ENGLISH image prompt for a modern, vibrant editorial hero image, no text, no letters",
  "coverAlt": "magyar alt szöveg a borítóképhez",
  "readMinutes": number,
  "blocks": [ {"type":"p","text":"..."}, {"type":"h2","text":"..."}, {"type":"h3","text":"..."}, {"type":"ul","items":["..."]}, {"type":"ol","items":["..."]}, {"type":"quote","text":"..."}, {"type":"cta","text":"...","href":"/register","label":"..."} ],
  "faq": [ {"q":"...","a":"..."} ]
}
Tartalmazzon a blocks legalább egy "cta" blokkot, amely a Creatorz egyik oldalára hív (pl. /register vagy /creators).`;

async function callAI(topic: string, angle: string, primaryKeyword: string, avoidTitles: string[]): Promise<GeneratedPost> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY hiányzik");
  const client = new OpenAI({ apiKey });

  const user = `Téma: ${topic}
Megközelítés: ${angle}
Fő kulcsszó: ${primaryKeyword}
Kerüld ezeket a már meglévő címeket (ne ismételd): ${avoidTitles.slice(0, 20).join(" | ") || "—"}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<GeneratedPost>;

  // Validáció / koerció
  const blocks = Array.isArray(parsed.blocks) ? (parsed.blocks as BlogBlock[]) : [];
  if (!parsed.title || blocks.length === 0) {
    throw new Error("Hiányos AI válasz (cím vagy tartalom üres)");
  }
  return {
    title: String(parsed.title).slice(0, 120),
    metaTitle: String(parsed.metaTitle || parsed.title).slice(0, 70),
    metaDescription: String(parsed.metaDescription || parsed.excerpt || "").slice(0, 165),
    excerpt: String(parsed.excerpt || "").slice(0, 300),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 10) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [],
    coverPrompt: String(parsed.coverPrompt || `editorial hero image about ${primaryKeyword}, modern, vibrant`),
    coverAlt: String(parsed.coverAlt || topic).slice(0, 160),
    readMinutes: Number(parsed.readMinutes) > 0 ? Math.min(20, Number(parsed.readMinutes)) : 5,
    blocks,
    faq: Array.isArray(parsed.faq) ? (parsed.faq as BlogFaq[]).slice(0, 6) : [],
  };
}

/** A FLUX által adott (ideiglenes) kép-URL letöltése és feltöltése a 'blog' bucketbe. */
async function persistCover(imageUrl: string, slug: string): Promise<{ url: string | null }> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return { url: null };
    const buf = Buffer.from(await res.arrayBuffer());
    const admin = createAdminClient();
    const path = `${slug}.webp`;
    const { error } = await admin.storage
      .from("blog")
      .upload(path, buf, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (error) return { url: null };
    const { data } = admin.storage.from("blog").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch {
    return { url: null };
  }
}

// Hiteles külső források — ha az AI nem szőtt be külső linket, ezekből kap a poszt.
const EXTERNAL_SOURCES = [
  "[Think with Google](https://www.thinkwithgoogle.com)",
  "[Statista – közösségi média statisztikák](https://www.statista.com/markets/424/topic/540/social-media/)",
  "[Hootsuite Blog](https://blog.hootsuite.com)",
  "[HubSpot Marketing Blog](https://blog.hubspot.com/marketing)",
  "[Meta for Business](https://www.facebook.com/business/news)",
];

/** Garantálja, hogy legyen legalább néhány külső link (SEO). */
function ensureExternalLinks(blocks: BlogBlock[]): BlogBlock[] {
  const hasExternal = blocks.some(
    (b) =>
      ("text" in b && /\]\(https?:\/\//.test(b.text)) ||
      ("items" in b && b.items.some((it) => /\]\(https?:\/\//.test(it))),
  );
  if (hasExternal) return blocks;
  const picks = [...EXTERNAL_SOURCES].sort(() => Math.random() - 0.5).slice(0, 3);
  return [
    ...blocks,
    { type: "h2", text: "Hasznos külső források" },
    {
      type: "p",
      text: "Ha mélyebben szeretnél elmerülni a témában, ezek a megbízható, naprakész szakmai források segítenek:",
    },
    { type: "ul", items: picks },
  ];
}

/** Egy témakör kiválasztása, ami a legkevésbé volt mostanában feldolgozva. */
function pickTopic(usedTopics: string[]) {
  const unused = BLOG_TOPICS.filter((t) => !usedTopics.includes(t.topic));
  const pool = unused.length > 0 ? unused : BLOG_TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Egy teljes, publikált blogbejegyzés generálása és mentése. Visszaadja a slug-ot. */
export async function generateAndPublishPost(): Promise<{ slug: string; title: string }> {
  const existing = await db
    .select({ title: blogPosts.title, topic: blogPosts.topic })
    .from(blogPosts);
  const usedTopics = existing.map((e) => e.topic).filter(Boolean) as string[];
  const avoidTitles = existing.map((e) => e.title);

  const choice = pickTopic(usedTopics);
  const post = await callAI(choice.topic, choice.angle, choice.primaryKeyword, avoidTitles);
  post.blocks = ensureExternalLinks(post.blocks);

  const slug = await uniqueSlug(slugify(post.title));

  // Borítókép — ha bármi hiba, a poszt akkor is publikálódik (kép nélkül).
  let coverUrl: string | null = null;
  try {
    const imgUrl = await generateImage(
      `${post.coverPrompt}. Editorial, high quality, vibrant lime-green and black accent palette, no text, no watermark`,
      { aspectRatio: "16:9" },
    );
    coverUrl = (await persistCover(imgUrl, slug)).url;
  } catch {
    coverUrl = null;
  }

  await db.insert(blogPosts).values({
    slug,
    title: post.title,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    excerpt: post.excerpt,
    coverUrl,
    coverAlt: post.coverAlt,
    content: post.blocks,
    faq: post.faq,
    keywords: post.keywords,
    tags: post.tags,
    topic: choice.topic,
    readMinutes: post.readMinutes,
    status: "published",
    aiGenerated: true,
    publishedAt: new Date(),
  });

  return { slug, title: post.title };
}
