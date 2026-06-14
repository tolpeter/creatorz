import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { GenerateButton, PostRowActions } from "@/components/admin/blog-admin";

export const metadata = { title: "Admin — Blog" };

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "short" }).format(new Date(d));
}

export default async function AdminBlogPage() {
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      status: blogPosts.status,
      views: blogPosts.views,
      aiGenerated: blogPosts.aiGenerated,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt))
    .limit(200);

  const published = posts.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} bejegyzés · {published} publikált. Automatikusan hetente
            2 új SEO-poszt készül (hétfőn és csütörtökön 1-1).
          </p>
        </div>
        <GenerateButton />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          Még nincs bejegyzés. Generálj egyet a gombbal, vagy várd meg a heti
          automatikus futást.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cím</th>
                <th className="px-4 py-3 font-medium">Státusz</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Megtek.</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Dátum</th>
                <th className="px-4 py-3 text-right font-medium">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="max-w-[320px] px-4 py-3">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (p.status === "published"
                          ? "bg-[#f0f4e5] text-[#3f6212]"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {p.status === "published" ? "Publikált" : "Piszkozat"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {p.views ?? 0}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {fmt(p.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <PostRowActions
                        id={p.id}
                        slug={p.slug}
                        published={p.status === "published"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
