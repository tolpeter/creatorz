import Link from "next/link";
import { eq, sql, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, ads, subscriptions, reviews } from "@/lib/db/schema";
import { getSetting } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatHuf } from "@/lib/utils/format";

export const metadata = { title: "Admin — Áttekintés" };

export default async function AdminOverviewPage() {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const monthly = Number(await getSetting("creator_subscription_price_huf"));

  const [usersN, activeSubsN, adsTodayN, pendingAdsN, reportedN] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ n: sql<number>`count(*)::int` }).from(ads).where(gte(ads.createdAt, todayStart)),
    db.select({ n: sql<number>`count(*)::int` }).from(ads).where(eq(ads.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.reported, true)),
  ]);

  const activeSubs = activeSubsN[0]?.n ?? 0;

  const kpis = [
    { label: "Összes felhasználó", value: String(usersN[0]?.n ?? 0) },
    { label: "Aktív előfizetés", value: String(activeSubs) },
    { label: "Havi MRR", value: formatHuf(activeSubs * monthly) },
    { label: "Ma feladott hirdetés", value: String(adsTodayN[0]?.n ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin áttekintés</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moderálandó hirdetés</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{pendingAdsN[0]?.n ?? 0}</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/ads">Megnyitás</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bejelentett értékelés</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{reportedN[0]?.n ?? 0}</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/reports">Megnyitás</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
