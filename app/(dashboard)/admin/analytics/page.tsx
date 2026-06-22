import { sql, gte, eq } from "drizzle-orm";
import {
  Users,
  Megaphone,
  Send,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  users,
  ads,
  adApplications,
  featurePurchases,
  subscriptions,
} from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHuf, formatNumber } from "@/lib/utils/format";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Admin — Analitika" };

const DAYS = 30;
const count = sql<number>`count(*)::int`;

type DayRow = { d: string; n: number };
type DayRoleRow = { d: string; role: string; n: number };

/** 30 napos sor feltöltése (hiányzó nap = 0). */
function buildSeries(map: Map<string, number>) {
  const now = Date.now();
  const out: { key: string; label: string; n: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    out.push({
      key,
      label: new Intl.DateTimeFormat("hu-HU", { day: "numeric" }).format(date),
      n: map.get(key) ?? 0,
    });
  }
  return out;
}

/** Ezredmásodperc → emberi olvasható idő (pl. "2 p 14 mp"). */
function fmtDur(ms: number): string {
  const s = Math.round((ms || 0) / 1000);
  if (s < 60) return `${s} mp`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} p ${r} mp` : `${m} p`;
}

export default async function AdminAnalyticsPage() {
  const since = new Date(Date.now() - DAYS * 86400000);
  const dayExpr = sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`;

  const [regRows, adRows, appRows, revRow, subsRow, price] = await Promise.all([
    db
      .select({ d: dayExpr, role: users.role, n: count })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`, users.role),
    db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${ads.createdAt}), 'YYYY-MM-DD')`,
        n: count,
      })
      .from(ads)
      .where(gte(ads.createdAt, since))
      .groupBy(sql`date_trunc('day', ${ads.createdAt})`),
    db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${adApplications.createdAt}), 'YYYY-MM-DD')`,
        n: count,
      })
      .from(adApplications)
      .where(gte(adApplications.createdAt, since))
      .groupBy(sql`date_trunc('day', ${adApplications.createdAt})`),
    db
      .select({
        sum: sql<number>`coalesce(sum(${featurePurchases.amountHuf}), 0)::int`,
        n: count,
      })
      .from(featurePurchases)
      .where(gte(featurePurchases.createdAt, since)),
    db
      .select({ n: count })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    getSetting("creator_subscription_price_huf"),
  ]);

  // Regisztrációk: creator vs márka napi bontásban
  const creatorMap = new Map<string, number>();
  const brandMap = new Map<string, number>();
  for (const r of regRows as DayRoleRow[]) {
    if (r.role === "creator") creatorMap.set(r.d, r.n);
    else if (r.role === "brand") brandMap.set(r.d, r.n);
  }
  const creatorSeries = buildSeries(creatorMap);
  const brandSeries = buildSeries(brandMap);
  const regDays = creatorSeries.map((c, i) => ({
    label: c.label,
    a: c.n,
    b: brandSeries[i]?.n ?? 0,
  }));

  const adSeries = buildSeries(new Map((adRows as DayRow[]).map((r) => [r.d, r.n])));
  const appSeries = buildSeries(new Map((appRows as DayRow[]).map((r) => [r.d, r.n])));

  const newCreators = creatorSeries.reduce((s, d) => s + d.n, 0);
  const newBrands = brandSeries.reduce((s, d) => s + d.n, 0);
  const newAds = adSeries.reduce((s, d) => s + d.n, 0);
  const newApps = appSeries.reduce((s, d) => s + d.n, 0);
  const featureRevenue = revRow[0]?.sum ?? 0;
  const featureCount = revRow[0]?.n ?? 0;
  const activeSubs = subsRow[0]?.n ?? 0;
  const mrr = activeSubs * Number(price ?? 0);

  // First-party "idő az oldalon" mérés (page_events). Best-effort: ha a tábla
  // még nincs migrálva / nincs adat, üresen marad.
  type SegRow = { registered: boolean; avg_ms: number; sessions: number };
  type PathRow = { path: string; avg_ms: number; views: number };
  type DailySegRow = { d: string; registered: boolean; avg_ms: number };
  type EntryRow = { path: string; n: number };
  let segRows: SegRow[] = [];
  let pathRows: PathRow[] = [];
  let dailySegRows: DailySegRow[] = [];
  let entryRows: EntryRow[] = [];
  let exitRows: EntryRow[] = [];
  try {
    segRows = (await db.execute(sql`
      SELECT registered, round(avg(total))::int AS avg_ms, count(*)::int AS sessions
      FROM (
        SELECT session_id, sum(duration_ms) AS total, bool_or(user_id IS NOT NULL) AS registered
        FROM page_events WHERE created_at > ${since} GROUP BY session_id
      ) s GROUP BY registered
    `)) as unknown as SegRow[];
    pathRows = (await db.execute(sql`
      SELECT path, round(avg(duration_ms))::int AS avg_ms, count(*)::int AS views
      FROM page_events WHERE created_at > ${since}
      GROUP BY path ORDER BY count(*) DESC LIMIT 15
    `)) as unknown as PathRow[];
    dailySegRows = (await db.execute(sql`
      SELECT to_char(d, 'YYYY-MM-DD') AS d, registered, round(avg(total))::int AS avg_ms
      FROM (
        SELECT session_id, date_trunc('day', min(created_at)) AS d, sum(duration_ms) AS total,
               bool_or(user_id IS NOT NULL) AS registered
        FROM page_events WHERE created_at > ${since} GROUP BY session_id
      ) s GROUP BY d, registered ORDER BY d
    `)) as unknown as DailySegRow[];
    entryRows = (await db.execute(sql`
      SELECT path, count(*)::int AS n FROM (
        SELECT DISTINCT ON (session_id) session_id, path
        FROM page_events WHERE created_at > ${since}
        ORDER BY session_id, created_at ASC
      ) e GROUP BY path ORDER BY count(*) DESC LIMIT 8
    `)) as unknown as EntryRow[];
    exitRows = (await db.execute(sql`
      SELECT path, count(*)::int AS n FROM (
        SELECT DISTINCT ON (session_id) session_id, path
        FROM page_events WHERE created_at > ${since}
        ORDER BY session_id, created_at DESC
      ) e GROUP BY path ORDER BY count(*) DESC LIMIT 8
    `)) as unknown as EntryRow[];
  } catch {
    /* tábla még nincs / nincs adat */
  }
  const regSeg = segRows.find((r) => r.registered);
  const anonSeg = segRows.find((r) => !r.registered);
  const totalSessions = (regSeg?.sessions ?? 0) + (anonSeg?.sessions ?? 0);
  const regSharePct =
    totalSessions > 0 ? Math.round(((regSeg?.sessions ?? 0) / totalSessions) * 100) : 0;
  // Napi átlagidő, regisztrált vs nem regisztrált bontásban.
  const regDaily = new Map(dailySegRows.filter((r) => r.registered).map((r) => [r.d, r.avg_ms]));
  const anonDaily = new Map(dailySegRows.filter((r) => !r.registered).map((r) => [r.d, r.avg_ms]));
  const regTimeSeries = buildSeries(regDaily);
  const anonTimeSeries = buildSeries(anonDaily);
  const timeSplit = regTimeSeries.map((c, i) => ({
    label: c.label,
    a: c.n,
    b: anonTimeSeries[i]?.n ?? 0,
  }));

  const kpis = [
    { label: "Új regisztráció", value: formatNumber(newCreators + newBrands), sub: `${newCreators} creator · ${newBrands} márka`, icon: Users },
    { label: "Új hirdetés", value: formatNumber(newAds), sub: `${DAYS} nap alatt`, icon: Megaphone },
    { label: "Pályázat", value: formatNumber(newApps), sub: `${DAYS} nap alatt`, icon: Send },
    { label: "Kiemelés-bevétel", value: formatHuf(featureRevenue), sub: `${featureCount} vásárlás`, icon: Wallet },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analitika</h1>
        <p className="text-muted-foreground">Az elmúlt {DAYS} nap trendjei.</p>
      </div>

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
                  <p className="truncate text-[11px] text-muted-foreground/80">{k.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Látogatottság — eltöltött idő (first-party mérés) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Eltöltött idő az oldalon</CardTitle>
          <p className="text-xs text-muted-foreground">
            Átlagos munkamenet-hossz és oldalankénti bontás · {DAYS} nap
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {segRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Még nincs elég mérési adat (a mérés most indult — pár óra/nap múlva
              jelennek meg az értékek).
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-[#f6f7f2] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4d7c0f]">
                    Regisztrált felhasználók
                  </p>
                  <p className="mt-1 text-2xl font-black">{fmtDur(regSeg?.avg_ms ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    átlagos munkamenet · {formatNumber(regSeg?.sessions ?? 0)} munkamenet
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nem regisztrált látogatók
                  </p>
                  <p className="mt-1 text-2xl font-black">{fmtDur(anonSeg?.avg_ms ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    átlagos munkamenet · {formatNumber(anonSeg?.sessions ?? 0)} munkamenet
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Belépők aránya
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#3f6212]">{regSharePct}%</p>
                  <p className="text-xs text-muted-foreground">
                    a munkamenetek {formatNumber(totalSessions)}-ből regisztrált
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">
                  Átlagos munkamenet-idő naponta
                </p>
                <TwoTimeBars days={timeSplit} />
                <div className="mt-3 flex gap-5 text-sm">
                  <Legend color="bg-accent" label="Regisztrált" />
                  <Legend color="bg-[#3f6212]" label="Nem regisztrált" />
                </div>
              </div>

              {(entryRows.length > 0 || exitRows.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <EntryExitList title="Belépési oldalak" rows={entryRows} />
                  <EntryExitList title="Kilépési oldalak" rows={exitRows} />
                </div>
              )}

              {pathRows.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold">Hol töltik az időt (oldalanként)</p>
                  <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Oldal</th>
                          <th className="px-3 py-2 text-right font-medium">Átlagos idő</th>
                          <th className="px-3 py-2 text-right font-medium">Megtekintés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pathRows.map((p) => (
                          <tr key={p.path} className="border-b last:border-0">
                            <td className="max-w-0 truncate px-3 py-2 font-medium">{p.path}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{fmtDur(p.avg_ms)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-muted-foreground">
                              {formatNumber(p.views)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[#4d7c0f]" />
            Regisztrációk — creator vs. márka
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StackedBars days={regDays} />
          <div className="mt-3 flex gap-5 text-sm">
            <Legend color="bg-accent" label={`Tartalomgyártó (${newCreators})`} />
            <Legend color="bg-[#3f6212]" label={`Márka (${newBrands})`} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Új hirdetések</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBars days={adSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pályázatok</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBars days={appSeries} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bevétel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-3xl font-black text-[#3f6212]">{formatHuf(mrr)}</p>
            <p className="text-xs text-muted-foreground">Becsült havi MRR ({activeSubs} előfizetés)</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatHuf(featureRevenue)}</p>
            <p className="text-xs text-muted-foreground">Kiemelés-bevétel / {DAYS} nap</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{featureCount}</p>
            <p className="text-xs text-muted-foreground">Kiemelés-vásárlás / {DAYS} nap</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function MiniBars({ days }: { days: { label: string; n: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <>
      <div className="flex h-32 items-end gap-[3px]">
        {days.map((d, i) => (
          <div
            key={i}
            className="w-full rounded-t bg-accent"
            style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n > 0 ? "3px" : "0" }}
            title={`${d.label}. — ${d.n}`}
          />
        ))}
      </div>
      <DayAxis days={days} />
    </>
  );
}

function TwoTimeBars({ days }: { days: { label: string; a: number; b: number }[] }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.a, d.b)));
  return (
    <>
      <div className="flex h-32 items-end gap-[3px]">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex w-full items-end gap-[1px]"
            title={`${d.label}. — Regisztrált: ${fmtDur(d.a)} · Nem regisztrált: ${fmtDur(d.b)}`}
          >
            <div
              className="w-1/2 rounded-t bg-accent"
              style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a > 0 ? "3px" : "0" }}
            />
            <div
              className="w-1/2 rounded-t bg-[#3f6212]"
              style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b > 0 ? "3px" : "0" }}
            />
          </div>
        ))}
      </div>
      <DayAxis days={days} />
    </>
  );
}

function EntryExitList({
  title,
  rows,
}: {
  title: string;
  rows: { path: string; n: number }[];
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nincs adat.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.path} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{r.path}</span>
              <span className="shrink-0 font-medium text-muted-foreground">
                {formatNumber(r.n)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StackedBars({ days }: { days: { label: string; a: number; b: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.a + d.b));
  return (
    <>
      <div className="flex h-40 items-end gap-[3px]">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex w-full flex-col-reverse"
            style={{ height: "100%" }}
            title={`${d.label}. — ${d.a} creator, ${d.b} márka`}
          >
            <div
              className="w-full rounded-b bg-[#3f6212]"
              style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b > 0 ? "3px" : "0" }}
            />
            <div
              className="w-full rounded-t bg-accent"
              style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a > 0 ? "3px" : "0" }}
            />
          </div>
        ))}
      </div>
      <DayAxis days={days} />
    </>
  );
}

function DayAxis({ days }: { days: { label: string }[] }) {
  return (
    <div className="mt-1 flex gap-[3px]">
      {days.map((d, i) => (
        <span
          key={i}
          className="w-full text-center text-[9px] text-muted-foreground"
        >
          {i % 5 === 0 ? d.label : ""}
        </span>
      ))}
    </div>
  );
}
