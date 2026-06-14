import Link from "next/link";
import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import { Newspaper, Clock, ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";

export const metadata = {
  title: "Blog — UGC, influencer marketing és tartalomgyártás",
  description:
    "Gyakorlati útmutatók és tippek márkáknak és tartalomgyártóknak a UGC, az influencer marketing és a közösségi média világából.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 3600; // óránként frissül

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "long" }).format(new Date(d));
}

export default async function BlogIndexPage() {
  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverUrl: blogPosts.coverUrl,
      coverAlt: blogPosts.coverAlt,
      tags: blogPosts.tags,
      readMinutes: blogPosts.readMinutes,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(60);

  const [featured, ...rest] = posts;

  return (
    <div className="py-10">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#a3e635]/40 bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#4d7c0f]">
          <Newspaper className="h-3.5 w-3.5" />
          Creatorz Blog
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Tudás a UGC-ről és a tartalommarketingről
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Gyakorlati útmutatók márkáknak és tartalomgyártóknak — hogy a következő
          kampányod tényleg eredményt hozzon.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          Hamarosan érkeznek az első bejegyzések.
        </div>
      ) : (
        <div className="mt-12 space-y-10">
          {/* Kiemelt (legfrissebb) */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-lg md:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#f0f4e5] md:aspect-auto">
                {featured.coverUrl ? (
                  <Image
                    src={featured.coverUrl}
                    alt={featured.coverAlt || featured.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#4d7c0f]">
                    <Sparkles className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-black">
                  <Sparkles className="h-3 w-3" /> Legfrissebb
                </span>
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {(featured.tags ?? []).slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-[#f0f4e5] px-2.5 py-0.5 font-medium text-[#4d7c0f]">
                      {t}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {featured.readMinutes} perc
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black leading-tight group-hover:text-[#3f6212] sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {featured.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7c0f]">
                  Olvasd el <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Többi poszt */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#f0f4e5]">
                    {p.coverUrl ? (
                      <Image
                        src={p.coverUrl}
                        alt={p.coverAlt || p.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#4d7c0f]">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {(p.tags ?? []).slice(0, 1).map((t) => (
                        <span key={t} className="rounded-full bg-[#f0f4e5] px-2.5 py-0.5 font-medium text-[#4d7c0f]">
                          {t}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.readMinutes} perc
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-[#3f6212]">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {p.excerpt}
                    </p>
                    <span className="mt-3 text-xs text-muted-foreground">
                      {formatDate(p.publishedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
