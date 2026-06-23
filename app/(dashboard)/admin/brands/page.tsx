import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandProfiles, ads } from "@/lib/db/schema";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminMessageButton } from "@/components/admin/admin-message-button";
import { ExportButton } from "@/components/admin/export-button";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Márkák" };

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(brandProfiles.companyName, like),
        ilike(brandProfiles.industry, like),
      )!,
    );
  }

  const rows = await db
    .select({
      id: brandProfiles.id,
      userId: brandProfiles.userId,
      companyName: brandProfiles.companyName,
      websiteUrl: brandProfiles.websiteUrl,
      industry: brandProfiles.industry,
      createdAt: brandProfiles.createdAt,
      adCount: sql<number>`count(${ads.id})::int`,
    })
    .from(brandProfiles)
    .leftJoin(ads, eq(ads.brandId, brandProfiles.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(brandProfiles.id)
    .orderBy(desc(brandProfiles.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Márkák</h1>
          <p className="text-muted-foreground">{rows.length} találat</p>
        </div>
        <ExportButton type="brands" />
      </div>

      <AdminSearch q={q} placeholder="Keresés cégnév vagy iparág alapján…" />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Cégnév</th>
              <th className="p-3">Iparág</th>
              <th className="p-3">Weboldal</th>
              <th className="p-3">Kampány</th>
              <th className="p-3">Regisztrált</th>
              <th className="p-3 text-right">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{b.companyName}</td>
                <td className="p-3">{b.industry ?? "—"}</td>
                <td className="p-3">
                  {b.websiteUrl ? (
                    <a
                      href={/^https?:\/\//i.test(b.websiteUrl) ? b.websiteUrl : `https://${b.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">{b.adCount}</td>
                <td className="p-3 whitespace-nowrap">{formatHuDate(b.createdAt)}</td>
                <td className="p-3 text-right">
                  <AdminMessageButton toUserId={b.userId} name={b.companyName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
