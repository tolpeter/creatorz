import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { ads } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdStatusBadge } from "@/components/shared/ad-status-badge";
import { formatBudgetRange, formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Kampányaim" };

export default async function BrandAdsPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const rows = await db
    .select()
    .from(ads)
    .where(eq(ads.brandId, brand.profile.id))
    .orderBy(desc(ads.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kampányaim</h1>
          <p className="text-muted-foreground">{rows.length} kampány</p>
        </div>
        <Button asChild>
          <Link href="/brand/ads/new">
            <Plus className="h-4 w-4" /> Új kampány
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0f4e5] text-[#4d7c0f]">
            <Plus className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold">Még nincs kampányod</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Adj fel egy briefet, és a tartalomgyártók pár kattintással pályáznak rá — ingyenes.
          </p>
          <Button asChild className="mt-5">
            <Link href="/brand/ads/new">
              <Plus className="h-4 w-4" /> Első kampány feladása
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cím</th>
                <th className="p-3">Bérezés</th>
                <th className="p-3">Határidő</th>
                <th className="p-3">Pályázat</th>
                <th className="p-3">Státusz</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/brand/ads/${a.id}`} className="font-medium hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatBudgetRange(a.budgetMinHuf, a.budgetMaxHuf)}
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatHuDate(a.deadline)}</td>
                  <td className="p-3">{a.applicationCount}</td>
                  <td className="p-3">
                    <AdStatusBadge status={a.status} />
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
