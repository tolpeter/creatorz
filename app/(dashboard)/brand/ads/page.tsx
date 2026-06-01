import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { ads } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdStatusBadge } from "@/components/shared/ad-status-badge";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Hirdetéseim" };

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
          <h1 className="text-2xl font-bold">Hirdetéseim</h1>
          <p className="text-muted-foreground">{rows.length} hirdetés</p>
        </div>
        <Button asChild>
          <Link href="/brand/ads/new">
            <Plus className="h-4 w-4" /> Új hirdetés
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs hirdetésed. Add fel az elsőt!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cím</th>
                <th className="p-3">Költségvetés</th>
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
                    {formatHuf(a.budgetMinHuf)} – {formatHuf(a.budgetMaxHuf)}
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
