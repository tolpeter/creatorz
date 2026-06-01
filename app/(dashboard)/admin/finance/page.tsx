import { eq, sql, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions, featurePurchases } from "@/lib/db/schema";
import { getSetting } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHuf } from "@/lib/utils/format";

export const metadata = { title: "Admin — Pénzügy" };

export default async function AdminFinancePage() {
  const monthly = Number(await getSetting("creator_subscription_price_huf"));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const activeSubs = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));
  const activeCount = activeSubs[0]?.n ?? 0;

  const canceledSubs = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "canceled"));

  const featTotal = await db
    .select({ sum: sql<number>`coalesce(sum(${featurePurchases.amountHuf}),0)::int`, n: sql<number>`count(*)::int` })
    .from(featurePurchases);

  const featThisMonth = await db
    .select({ sum: sql<number>`coalesce(sum(${featurePurchases.amountHuf}),0)::int`, n: sql<number>`count(*)::int` })
    .from(featurePurchases)
    .where(gte(featurePurchases.createdAt, monthStart));

  const mrr = activeCount * monthly;

  const cards = [
    { label: "MRR (havi ismétlődő bevétel)", value: formatHuf(mrr) },
    { label: "Aktív előfizetés", value: String(activeCount) },
    { label: "Lemondott előfizetés", value: String(canceledSubs[0]?.n ?? 0) },
    { label: "Kiemelés bevétel (összes)", value: formatHuf(featTotal[0]?.sum ?? 0) },
    { label: "Kiemelés ebben a hónapban", value: `${formatHuf(featThisMonth[0]?.sum ?? 0)} (${featThisMonth[0]?.n ?? 0} db)` },
    { label: "Kiemelés-vásárlások (összes)", value: String(featTotal[0]?.n ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pénzügy</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
