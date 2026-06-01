import Link from "next/link";
import { or, eq, sql } from "drizzle-orm";
import { Search, UserPlus, Handshake, Check } from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles, ads, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function LandingPage() {
  const current = await getCurrentUser();

  const featuredRows = await db
    .select({
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      city: creatorProfiles.city,
      categories: creatorProfiles.categories,
      instagramFollowers: creatorProfiles.instagramFollowers,
      instagramVerified: creatorProfiles.instagramVerified,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      tiktokVerified: creatorProfiles.tiktokVerified,
      isFeatured: creatorProfiles.isFeatured,
      isAdminFeatured: creatorProfiles.isAdminFeatured,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(or(eq(creatorProfiles.isFeatured, true), eq(creatorProfiles.isAdminFeatured, true)))
    .orderBy(sql`${creatorProfiles.averageRating} desc nulls last`)
    .limit(6);

  const featured: CreatorCardData[] = featuredRows.map((r) => ({
    ...r,
    categories: r.categories ?? [],
    isFeatured: r.isFeatured || r.isAdminFeatured,
  }));

  const [cN, bN, aN] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(creatorProfiles),
    db.select({ n: sql<number>`count(*)::int` }).from(brandProfiles),
    db.select({ n: sql<number>`count(*)::int` }).from(ads).where(eq(ads.status, "active")),
  ]);

  const steps = [
    { icon: UserPlus, title: "1. Regisztrálj", desc: "Ingyenes, 2 perc. Creatorként vagy márkaként." },
    { icon: Search, title: "2. Találd meg a párost", desc: "Szűrőkkel a tökéletes creatort, vagy pályázz hirdetésre." },
    { icon: Handshake, title: "3. Kezdj el dolgozni", desc: "Közvetlen kapcsolatfelvétel, együttműködés, értékelés." },
  ];

  const faqs = [
    { q: "Mennyibe kerül?", a: "A böngészés és kapcsolatfelvétel a márkáknak ingyenes. A creator regisztráció jelenleg ingyenes (később opcionálisan 2 490 Ft/hó)." },
    { q: "Mit tartalmaz a creator előfizetés?", a: "Aktív megjelenés a directoryban, pályázás hirdetésekre, és a teljes profil. Kiemelés külön vásárolható." },
    { q: "Hogyan véditek az adatokat?", a: "GDPR-konform adatkezelés, a session-öket biztonságosan kezeljük, böngésző-tárolás nélkül." },
    { q: "Mi az UGC?", a: "User Generated Content — valódi emberek által készített, autentikus videós/fotós tartalom márkák számára." },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-white">
            creatorz<span className="text-accent">.</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <Link href="/creators" className="hover:text-accent">Creatorok</Link>
            <Link href="/ads" className="hover:text-accent">Hirdetések</Link>
            <Link href="/#hogyan" className="hover:text-accent">Hogyan működik</Link>
          </nav>
          <div className="flex items-center gap-2">
            {current?.dbUser ? (
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/dashboard">Irányítópult</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                  <Link href="/login">Bejelentkezés</Link>
                </Button>
                <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/register">Regisztráció</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(163,230,53,0.18), transparent), radial-gradient(40% 40% at 80% 80%, rgba(163,230,53,0.10), transparent), linear-gradient(180deg, #0A0A0A, #0f0f0f)",
        }}
      >
        <Badge className="mb-6 border-accent/40 bg-accent/20 text-accent">
          ✨ Magyar UGC tartalomgyártók új otthona
        </Badge>
        <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight md:text-7xl">
          Találd meg a tökéletes
          <span className="block text-accent">UGC creatort</span>
          a márkádhoz
        </h1>
        <p className="mb-10 max-w-2xl text-balance text-lg text-white/70 md:text-xl">
          Magyar tartalomgyártók és márkák találkozóhelye. Regisztrálj ingyen,
          böngéssz portfóliókat, vagy add fel a hirdetésed.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/register">Creator vagyok →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/register">Brandet képviselek →</Link>
          </Button>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-8">
          <Stat value={`${cN[0]?.n ?? 0}`} label="Creator" />
          <Stat value={`${bN[0]?.n ?? 0}`} label="Márka" />
          <Stat value="100%" label="Magyar" />
        </div>
      </section>

      {/* HOGYAN MŰKÖDIK */}
      <section id="hogyan" className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Hogyan működik?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-xl border p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                <s.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CREATOROK */}
      {featured.length > 0 && (
        <section className="bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Kiemelt creatorok</h2>
              <Link href="/creators" className="text-sm font-semibold text-accent hover:underline">
                Mind megtekintése →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <CreatorCard key={c.username} creator={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* KÉT OLDAL */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 md:grid-cols-2">
        <SideCard
          title="Márka vagy?"
          perks={["Ingyenes böngészés és kapcsolatfelvétel", "Hirdetésfeladás díjmentesen", "Szűrés kategória, követőszám, ár szerint", "Ellenőrzött, értékelt creatorok"]}
          cta="Márkaként kezdem"
        />
        <SideCard
          title="Creator vagy?"
          perks={["Ingyenes profil és portfólió", "Pályázz márkák hirdetéseire", "Építsd a hírneved értékelésekkel", "Opcionális kiemelés a directoryban"]}
          cta="Creatorként csatlakozom"
          highlight
        />
      </section>

      {/* STATISZTIKA */}
      <section className="bg-[#0A0A0A] py-16 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-8 px-6 text-center">
          <Stat value={`${cN[0]?.n ?? 0}`} label="Aktív creator" />
          <Stat value={`${aN[0]?.n ?? 0}`} label="Aktív hirdetés" />
          <Stat value={`${bN[0]?.n ?? 0}`} label="Regisztrált márka" />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="mb-8 text-center text-3xl font-bold">Gyakori kérdések</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-accent">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function SideCard({
  title,
  perks,
  cta,
  highlight,
}: {
  title: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-8 ${highlight ? "border-accent ring-1 ring-accent" : ""}`}>
      <h3 className="mb-4 text-2xl font-bold">{title}</h3>
      <ul className="mb-6 space-y-2">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {p}
          </li>
        ))}
      </ul>
      <Button asChild variant={highlight ? "default" : "outline"}>
        <Link href="/register">{cta}</Link>
      </Button>
    </div>
  );
}
