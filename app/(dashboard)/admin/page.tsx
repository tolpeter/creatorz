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
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
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
    { label: "Összes felhasználó", value: v(summary?.usersN), icon: Users, tint: "bg-[#eef4dc] text-[#3f6212]" },
    { label: "Tartalomgyártók", value: v(summary?.creatorsN), icon: UserCheck, tint: "bg-violet-50 text-violet-600" },
    { label: "Márkák", value: v(summary?.brandsN), icon: Building2, tint: "bg-blue-50 text-blue-600" },
    { label: "Hitelesített creator", value: v(summary?.verifiedN), icon: BadgeCheck, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Aktív kampány", value: v(summary?.activeAdsN), icon: Megaphone, tint: "bg-amber-50 text-amber-600" },
    { label: "Együttműködések", value: v(summary?.collabsN), icon: Handshake, tint: "bg-teal-50 text-teal-600" },
    { label: "Üzenetek", value: v(summary?.messagesN), icon: MessageSquare, tint: "bg-sky-50 text-sky-600" },
    { label: "Értékelések", value: v(summary?.reviewsN), icon: Star, tint: "bg-rose-50 text-rose-600" },
  ];

  const todos = [
    { label: "Moderálandó kampány", value: v(summary?.pendingAdsN), href: "/admin/ads", icon: Megaphone },
    { label: "Nyitott bejelentés", value: v(summary?.openReportsN), href: "/admin/reports", icon: AlertTriangle },
    { label: "Bejelentett értékelés", value: v(summary?.reportedReviewsN), href: "/admin/reports", icon: Star },
  ];
  const openTodos = todos.reduce((s, t) => s + t.value, 0);

  return (
    <div className="space-y-7">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d0a] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(163,230,53,0.16),transparent_42%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              <Sparkles className="h-3 w-3" /> Admin
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Admin áttekintés</h1>
            <p className="mt-1 text-sm text-white/60">
              A platform pillanatképe — felhasználók, kampányok és bevétel egy helyen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {openTodos > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" /> {openTodos} teendő
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent">
                <CheckCircle2 className="h-4 w-4" /> Minden rendben
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Teendők — kiemelten, ha van nyitott */}
      <div className="grid gap-3 sm:grid-cols-3">
        {todos.map((t) => {
          const Icon = t.icon;
          const has = t.value > 0;
          return (
            <Link
              key={t.label}
              href={t.href}
              className={
                "group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md " +
                (has ? "border-red-200 bg-red-50/60" : "border-black/10 bg-card")
              }
            >
              <span
                className={
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
                  (has ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground")
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={"text-2xl font-black leading-none " + (has ? "text-red-600" : "")}>{t.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{t.label}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          );
        })}
      </div>

      {/* Fő KPI-k */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="group rounded-2xl border border-black/10 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={"flex h-11 w-11 items-center justify-center rounded-xl " + k.tint}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-3xl font-black leading-none tracking-tight">{k.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Növekedés + bevétel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef4dc] text-[#3f6212]">
                <TrendingUp className="h-4 w-4" />
              </span>
              Regisztrációk — utolsó 14 nap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-1.5">
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-accent/70 to-accent transition-all group-hover:opacity-90"
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

        <Card className="overflow-hidden rounded-2xl border-0 bg-[#0b0d0a] text-white">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Becsült havi bevétel (MRR)
              </p>
              <p className="mt-1 text-4xl font-black text-accent">{formatHuf(activeSubs * monthly)}</p>
            </div>
            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-2xl font-bold">{activeSubs}</p>
                <p className="text-xs text-white/50">Aktív előfizetés</p>
              </div>
              <p className="text-sm text-white/60">{formatHuf(monthly)}/hó</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biztonsági mentés és exportok */}
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4dc] text-[#3f6212]">
              <DatabaseBackup className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Teljes adatbázis-mentés (JSON)</p>
              <p className="text-sm text-muted-foreground">
                Az összes tábla egyetlen JSON fájlban (felhasználók, kampányok, üzenetek, beállítások).
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
                <Download className="h-4 w-4" /> Kampányok CSV
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
