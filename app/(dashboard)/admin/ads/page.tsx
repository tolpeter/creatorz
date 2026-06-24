import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Archive, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdStatusBadge } from "@/components/shared/ad-status-badge";
import { AdModerationActions } from "@/components/admin/ad-moderation-actions";
import { AdLifecycleActions } from "@/components/shared/ad-lifecycle-actions";
import { ExportButton } from "@/components/admin/export-button";
import { Button } from "@/components/ui/button";
import { formatBudgetRange, formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Kampányok" };

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
      deletedAt: ads.deletedAt,
      deletedByRole: ads.deletedByRole,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .orderBy(desc(ads.createdAt))
    .limit(400);

  const archived = rows.filter((r) => r.deletedAt);
  const live = rows.filter((r) => !r.deletedAt);
  const pending = live.filter((r) => r.status === "pending");
  const others = live.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kampányok moderálása</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/admin/ads/new">
              <Plus className="h-4 w-4" /> Új kampány
            </Link>
          </Button>
          <ExportButton type="ads" />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Moderálásra vár ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs moderálandó kampány.</p>
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
                <div className="flex flex-wrap items-center gap-3">
                  <AdModerationActions adId={a.id} status={a.status} featured={a.isFeatured} />
                  <AdLifecycleActions adId={a.id} status={a.status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Összes kampány</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cím</th>
                <th className="p-3">Márka</th>
                <th className="p-3">Státusz</th>
                <th className="p-3">Létrehozva</th>
                <th className="p-3">Kezelés</th>
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
                  <td className="p-3">
                    <AdStatusBadge status={a.status} />
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatHuDate(a.createdAt)}</td>
                  <td className="p-3">
                    <AdLifecycleActions adId={a.id} status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Archívum (törölt kampányok) — bármikor visszanézhető/visszaállítható */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Archive className="h-4 w-4" /> Archívum — törölt kampányok ({archived.length})
        </h2>
        {archived.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs törölt kampány.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Cím</th>
                  <th className="p-3">Márka</th>
                  <th className="p-3">Törölte</th>
                  <th className="p-3">Törölve</th>
                  <th className="p-3">Visszaállítás</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{a.title}</td>
                    <td className="p-3">{a.brandName}</td>
                    <td className="p-3">
                      {a.deletedByRole === "admin"
                        ? "Admin"
                        : a.deletedByRole === "brand"
                          ? "Márka"
                          : "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {a.deletedAt ? formatHuDate(a.deletedAt) : "—"}
                    </td>
                    <td className="p-3">
                      <AdLifecycleActions adId={a.id} status={a.status} deleted />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
