import { sql, inArray, desc, eq } from "drizzle-orm";
import { ArrowLeftRight, Handshake, MessageSquare, Users2 } from "lucide-react";
import { db } from "@/lib/db";
import {
  users,
  creatorProfiles,
  brandProfiles,
  collaborations,
  ads,
} from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Kapcsolatok" };
export const dynamic = "force-dynamic";

type Party = { name: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  creator: "Alkotó",
  brand: "Márka",
  admin: "Admin",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Folyamatban",
  review_pending: "Értékelésre vár",
  reviewed: "Értékelve",
  closed: "Lezárva",
};

export default async function AdminConnectionsPage() {
  // 1) Üzenet-kapcsolatok: irányfüggetlen párok (ki kivel levelezett), darabszám
  //    + utolsó üzenet ideje. A TARTALMAT szándékosan nem kérdezzük le.
  let pairs: { a: string; b: string; cnt: number; last: Date }[] = [];
  try {
    const rows = await db.execute(sql`
      SELECT
        least(from_user_id, to_user_id)::text AS a,
        greatest(from_user_id, to_user_id)::text AS b,
        count(*)::int AS cnt,
        max(created_at) AS last
      FROM messages
      GROUP BY 1, 2
      ORDER BY max(created_at) DESC
      LIMIT 300
    `);
    const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    pairs = (list as Record<string, unknown>[]).map((r) => ({
      a: String(r.a),
      b: String(r.b),
      cnt: Number(r.cnt) || 0,
      last: new Date(r.last as string),
    }));
  } catch {
    pairs = [];
  }

  // Név + szerep feloldás minden érintett userre
  const ids = Array.from(new Set(pairs.flatMap((p) => [p.a, p.b])));
  const nameMap = new Map<string, Party>();
  if (ids.length) {
    const people = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email,
        creatorName: creatorProfiles.displayName,
        brandName: brandProfiles.companyName,
      })
      .from(users)
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
      .where(inArray(users.id, ids));
    for (const p of people) {
      nameMap.set(p.id, {
        name: p.brandName ?? p.creatorName ?? p.email ?? "(ismeretlen)",
        role: ROLE_LABEL[p.role] ?? p.role,
      });
    }
  }
  const party = (id: string): Party => nameMap.get(id) ?? { name: "(ismeretlen)", role: "—" };

  // 2) Együttműködések (márka ↔ alkotó), tartalom nélkül
  const collabs = await db
    .select({
      id: collaborations.id,
      status: collaborations.status,
      acceptedAt: collaborations.acceptedAt,
      completedAt: collaborations.completedAt,
      brandName: brandProfiles.companyName,
      creatorName: creatorProfiles.displayName,
      creatorUsername: creatorProfiles.username,
      adTitle: ads.title,
    })
    .from(collaborations)
    .leftJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .leftJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .leftJoin(ads, eq(ads.id, collaborations.adId))
    .orderBy(desc(collaborations.acceptedAt))
    .limit(200);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Kapcsolatok</h1>
        <p className="text-muted-foreground">
          Ki kivel vette fel a kapcsolatot és milyen együttműködések jöttek létre.
          Az üzenetek <strong>tartalmát</strong> nem látod — csak a kapcsolatot.
        </p>
      </div>

      {/* Üzenet-kapcsolatok */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">Üzenet-kapcsolatok</p>
            <p className="text-xs text-muted-foreground">
              {pairs.length} beszélgetés-pár (legutóbbi elöl)
            </p>
          </div>
        </div>

        {pairs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Még nincs üzenetváltás.
          </p>
        ) : (
          <div className="divide-y">
            {pairs.map((p, i) => {
              const A = party(p.a);
              const B = party(p.b);
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
                >
                  <span className="font-semibold">{A.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{A.role}</Badge>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{B.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{B.role}</Badge>
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{p.cnt} üzenet</span>
                    <span>{formatHuDate(p.last)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Együttműködések */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
            <Handshake className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">Együttműködések</p>
            <p className="text-xs text-muted-foreground">
              {collabs.length} létrejött együttműködés (márka ↔ alkotó)
            </p>
          </div>
        </div>

        {collabs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Még nincs együttműködés.
          </p>
        ) : (
          <div className="divide-y">
            {collabs.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
              >
                <span className="font-semibold">{c.brandName ?? "(törölt márka)"}</span>
                <Badge variant="secondary" className="text-[10px]">Márka</Badge>
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {c.creatorName ?? c.creatorUsername ?? "(törölt alkotó)"}
                </span>
                <Badge variant="secondary" className="text-[10px]">Alkotó</Badge>
                {c.adTitle && (
                  <span className="text-xs text-muted-foreground">· „{c.adTitle}"</span>
                )}
                <span className="ml-auto flex items-center gap-3 text-xs">
                  <Badge
                    className={
                      c.status === "closed"
                        ? "bg-foreground/10 text-foreground"
                        : "bg-accent/20 text-[#3f6212]"
                    }
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatHuDate(c.completedAt ?? c.acceptedAt)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
