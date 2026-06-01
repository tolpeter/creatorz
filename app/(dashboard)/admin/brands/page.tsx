import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandProfiles, ads } from "@/lib/db/schema";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Márkák" };

export default async function AdminBrandsPage() {
  const rows = await db
    .select({
      id: brandProfiles.id,
      companyName: brandProfiles.companyName,
      websiteUrl: brandProfiles.websiteUrl,
      industry: brandProfiles.industry,
      createdAt: brandProfiles.createdAt,
      adCount: sql<number>`count(${ads.id})::int`,
    })
    .from(brandProfiles)
    .leftJoin(ads, eq(ads.brandId, brandProfiles.id))
    .groupBy(brandProfiles.id)
    .orderBy(desc(brandProfiles.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Márkák</h1>
        <p className="text-muted-foreground">{rows.length} márka</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Cégnév</th>
              <th className="p-3">Iparág</th>
              <th className="p-3">Weboldal</th>
              <th className="p-3">Hirdetés</th>
              <th className="p-3">Regisztrált</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{b.companyName}</td>
                <td className="p-3">{b.industry ?? "—"}</td>
                <td className="p-3">
                  {b.websiteUrl ? (
                    <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">{b.adCount}</td>
                <td className="p-3 whitespace-nowrap">{formatHuDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
