import Link from "next/link";
import { sql, gte } from "drizzle-orm";
import {
  Users,
  UserCheck,
  Building2,
  Megaphone,
  Handshake,
  MessageSquare,
  Star,
  BadgeCheck,
  TrendingUp,
  Download,
  DatabaseBackup,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  users,
  ads,
  subscriptions,
  reviews,
  creatorProfiles,
  collaborations,
  messages,
  reports,
  settings,
} from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatHuf } from "@/lib/utils/format";

export const metadata = { title: "Admin — Áttekintés" };

const count = sql<number>`count(*)::int`;

type AdminSummary = {
  usersN: number;
  creatorsN: number;
  brandsN: number;
  verifiedN: number;
  activeAdsN: number;
  collabsN: number;
  messagesN: number;
  reviewsN: number;
  activeSubsN: number;
  adsTodayN: number;
  pendingAdsN: number;
  openReportsN: number;
  reportedReviewsN: number;
  new7N: number;
  new30N: number;
  monthlyPrice: unknown;
};

export default async function AdminOverviewPage() {
  const now = new Date();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const week = new Date(now.getTime() - 7 * 86400000);
  const month = new Date(now.getTime() - 30 * 86400000);
  const todayStartIso = todayStart.toISOString();
  const weekIso = week.toISOString();
  const monthIso = month.toISOString();
  const [summaryRows, trendRows] = await Promise.all([
    db.execute(sql<AdminSummary>`
      select
        (select count(*)::int from ${users}) as "usersN",
        (select count(*)::int from ${users} where ${users.role} = 'creator') as "creatorsN",
        (select count(*)::int from ${users} where ${users.role} = 'brand') as "brandsN",
        (select count(*)::int from ${creatorProfiles} where ${creatorProfiles.verified} = true) as "verifiedN",
        (select count(*)::int from ${ads} where ${ads.status} = 'active') as "activeAdsN",
        (select count(*)::int from ${collaborations}) as "collabsN",
        (select count(*)::int from ${messages}) as "messagesN",
        (select count(*)::int from ${reviews}) as "reviewsN",
        (select count(*)::int from ${subscriptions} where ${subscriptions.status} = 'active') as "activeSubsN",
        (select count(*)::int from ${ads} where ${ads.createdAt} >= ${todayStartIso}::timestamp) as "adsTodayN",
        (select count(*)::int from ${ads} where ${ads.status} = 'pending') as "pendingAdsN",
        (select count(*)::int from ${reports} where ${reports.status} = 'open') as "openReportsN",
        (select count(*)::int from ${reviews} where ${reviews.reported} = true) as "reportedReviewsN",
        (select count(*)::int from ${users} where ${users.createdAt} >= ${weekIso}::timestamp) as "new7N",
        (select count(*)::int from ${users} where ${users.createdAt} >= ${monthIso}::timestamp) as "new30N",
        coalesce(
          (select ${settings.value} from ${settings} where ${settings.key} = 'creator_subscription_price_huf' limit 1),
          to_jsonb(2490)
        ) as "monthlyPrice"
    `),
    db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
        n: count,
      })
      .from(users)
      .where(gte(users.createdAt, new Date(now.getTime() - 14 * 86400000)))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`),
  ]);

  const summary = summaryRows[0] as AdminSummary | undefined;
  const v = (value: number | undefined) => value ?? 0;
  const activeSubs = v(summary?.activeSubsN);
  const monthly = Number(summary?.monthlyPrice ?? 2490);

  // 14 napos regisztrációs trend (hiányzó napok = 0)
  const trendMap = new Map(trendRows.map((r) => [r.d, r.n]));
  const days: { label: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    days.push({
      label: new Intl.DateTimeFormat("hu-HU", { day: "numeric" }).format(date),
      n: trendMap.get(key) ?? 0,
    });
  }
  const maxN = Math.max(1, ...days.map((d) => d.n));

  const kpis = [
    { label: "Összes felhasználó", value: v(summary?.usersN), icon: Users },
    { label: "Tartalomgyártók", value: v(summary?.creatorsN), icon: UserCheck },
    { label: "Márkák", value: v(summary?.brandsN), icon: Building2 },
    { label: "Hitelesített creator", value: v(summary?.verifiedN), icon: BadgeCheck },
    { label: "Aktív hirdetés", value: v(summary?.activeAdsN), icon: Megaphone },
    { label: "Együttműködések", value: v(summary?.collabsN), icon: Handshake },
    { label: "Üzenetek", value: v(summary?.messagesN), icon: MessageSquare },
    { label: "Értékelések", value: v(summary?.reviewsN), icon: Star },
  ];

  const todos = [
    { label: "Moderálandó hirdetés", value: v(summary?.pendingAdsN), href: "/admin/ads" },
    { label: "Nyitott bejelentés", value: v(summary?.openReportsN), href: "/admin/reports" },
    { label: "Bejelentett értékelés", value: v(summary?.reportedReviewsN), href: "/admin/reports" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin áttekintés</h1>

      {/* Fő KPI-k */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-none">{k.value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Növekedés + bevétel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[#4d7c0f]" />
              Regisztrációk — utolsó 14 nap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-1.5">
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-accent"
                    style={{ height: `${(d.n / maxN) * 100}%`, minHeight: d.n > 0 ? "4px" : "0" }}
                    title={`${d.n} regisztráció`}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-6 text-sm">
              <span>
                <strong className="text-[#3f6212]">{v(summary?.new7N)}</strong>{" "}
                <span className="text-muted-foreground">új / 7 nap</span>
              </span>
              <span>
                <strong className="text-[#3f6212]">{v(summary?.new30N)}</strong>{" "}
                <span className="text-muted-foreground">új / 30 nap</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bevétel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-black text-[#3f6212]">{formatHuf(activeSubs * monthly)}</p>
              <p className="text-xs text-muted-foreground">Becsült havi MRR</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSubs}</p>
              <p className="text-xs text-muted-foreground">Aktív előfizetés · {formatHuf(monthly)}/hó</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biztonsági mentés és exportok */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Biztonsági mentés</h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
                <DatabaseBackup className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Teljes adatbázis-mentés (JSON)</p>
                <p className="text-sm text-muted-foreground">
                  Letölti az összes táblát egyetlen JSON fájlba (felhasználók, hirdetések, üzenetek, beállítások).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-[#0a0a0a] text-white hover:bg-accent hover:text-black">
                <a href="/api/admin/backup" download>
                  <DatabaseBackup className="h-4 w-4" /> Mentés letöltése
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/api/admin/export?type=users" download>
                  <Download className="h-4 w-4" /> Felhasználók CSV
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/api/admin/export?type=ads" download>
                  <Download className="h-4 w-4" /> Hirdetések CSV
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teendők */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Teendők</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {todos.map((t) => (
            <Card key={t.label} className={t.value > 0 ? "border-accent/50" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className={"text-2xl font-bold " + (t.value > 0 ? "text-red-600" : "")}>
                  {t.value}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={t.href}>Megnyitás</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
