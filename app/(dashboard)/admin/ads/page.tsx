import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdStatusBadge } from "@/components/shared/ad-status-badge";
import { AdModerationActions } from "@/components/admin/ad-moderation-actions";
import { ExportButton } from "@/components/admin/export-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatBudgetRange, formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Hirdetések" };

export default async function AdminAdsPage() {
  const rows = await db
    .select({
      id: ads.id,
      slug: ads.slug,
      title: ads.title,
      description: ads.description,
      status: ads.status,
      isFeatured: ads.isFeatured,
      budgetMinHuf: ads.budgetMinHuf,
      budgetMaxHuf: ads.budgetMaxHuf,
      deadline: ads.deadline,
      createdAt: ads.createdAt,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .orderBy(desc(ads.createdAt))
    .limit(200);

  const pending = rows.filter((r) => r.status === "pending");
  const others = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hirdetések moderálása</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/admin/ads/new">
              <Plus className="h-4 w-4" /> Új hirdetés
            </Link>
          </Button>
          <ExportButton type="ads" />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Moderálásra vár ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs moderálandó hirdetés.</p>
        ) : (
          pending.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <span className="text-sm text-muted-foreground">{a.brandName}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{a.description}</p>
                <p className="text-sm">
                  {formatBudgetRange(a.budgetMinHuf, a.budgetMaxHuf)} · Határidő:{" "}
                  {formatHuDate(a.deadline)}
                </p>
                <AdModerationActions adId={a.id} status={a.status} featured={a.isFeatured} />
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Összes hirdetés</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cím</th>
                <th className="p-3">Márka</th>
                <th className="p-3">Státusz</th>
                <th className="p-3">Létrehozva</th>
              </tr>
            </thead>
            <tbody>
              {others.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/ads/${a.slug ?? a.id}`} target="_blank" className="hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="p-3">{a.brandName}</td>
                  <td className="p-3"><AdStatusBadge status={a.status} /></td>
                  <td className="p-3 whitespace-nowrap">{formatHuDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
