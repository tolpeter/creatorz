import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { Clock, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { PostContent } from "@/components/blog/post-content";
import type { Metadata } from "next";

export const revalidate = 3600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getPost(slug: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return post ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Bejegyzés nem található" };
  const url = `${APP_URL}/blog/${post.slug}`;
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    keywords: post.keywords ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      url,
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "long" }).format(new Date(d));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Megtekintés-számláló (best-effort, nem blokkol)
  void db
    .update(blogPosts)
    .set({ views: (post.views ?? 0) + 1 })
    .where(eq(blogPosts.id, post.id))
    .then(
      () => {},
      () => {},
    );

  const related = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      coverUrl: blogPosts.coverUrl,
      coverAlt: blogPosts.coverAlt,
      readMinutes: blogPosts.readMinutes,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), ne(blogPosts.id, post.id)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  const url = `${APP_URL}/blog/${post.slug}`;
  const faq = post.faq ?? [];

  // JSON-LD: Article + Breadcrumb + (opcionális) FAQ
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: post.coverUrl ? [post.coverUrl] : undefined,
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt?.toISOString(),
      author: { "@type": "Organization", name: "Creatorz" },
      publisher: {
        "@type": "Organization",
        name: "Creatorz",
        logo: { "@type": "ImageObject", url: `${APP_URL}/og-image.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: (post.keywords ?? []).join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Főoldal", item: APP_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${APP_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <article className="mx-auto max-w-3xl py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Vissza a bloghoz
      </Link>

      {/* Fejléc */}
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {(post.tags ?? []).slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-[#f0f4e5] px-2.5 py-0.5 font-medium text-[#4d7c0f]">
              {t}
            </span>
          ))}
        </div>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {post.readMinutes} perc olvasás
          </span>
        </div>
      </header>

      {/* Borítókép */}
      {post.coverUrl && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#f0f4e5]">
          <Image
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Bevezető */}
      {post.excerpt && (
        <p className="mt-6 text-lg font-medium leading-8 text-foreground/90">
          {post.excerpt}
        </p>
      )}

      {/* Tartalom */}
      <div className="mt-6">
        <PostContent blocks={post.content ?? []} />
      </div>

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-black">Gyakori kérdések</h2>
          <div className="mt-4 space-y-2">
            {faq.map((f, i) => (
              <details key={i} className="group rounded-xl border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="mt-12 overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 text-center text-white sm:p-8">
        <h2 className="text-xl font-bold">Készen állsz a következő kampányra?</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-white/60">
          Böngéssz a magyar UGC tartalomgyártók között, vagy regisztrálj alkotóként.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/creators" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-white">
            Tartalomgyártók <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">
            Ingyenes regisztráció
          </Link>
        </div>
      </div>

      {/* Kapcsolódó */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold">További olvasnivaló</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="group rounded-xl border bg-card p-3 transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#f0f4e5]">
                  {r.coverUrl && (
                    <Image src={r.coverUrl} alt={r.coverAlt || r.title} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-[#3f6212]">
                  {r.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
