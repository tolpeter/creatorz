import Link from "next/link";
import Image from "next/image";
import { or, eq, sql } from "drizzle-orm";
import { Search, UserPlus, Handshake, Check } from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles, ads, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { Logo } from "@/components/layout/logo";
import { NicheBrowser } from "@/components/shared/niche-browser";

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
    { icon: UserPlus, title: "1. Regisztrálj", desc: "Ingyenes, 2 perc. Tartalomgyártóként vagy márkaként." },
    { icon: Search, title: "2. Találd meg a párost", desc: "Szűrőkkel a tökéletes tartalomgyártót, vagy pályázz hirdetésre." },
    { icon: Handshake, title: "3. Kezdj el dolgozni", desc: "Közvetlen kapcsolatfelvétel, együttműködés, értékelés." },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* STICKY FLOATING PILL NAV */}
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-white/10 bg-[#0A0A0A]/85 px-4 py-2.5 shadow-xl backdrop-blur-lg sm:px-6">
          <Logo variant="light" className="text-lg" />
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <Link href="/creators" className="hover:text-accent">Tartalomgyártók</Link>
            <Link href="/ads" className="hover:text-accent">Hirdetések</Link>
            <Link href="/#hogyan" className="hover:text-accent">Hogyan működik</Link>
          </nav>
          <div className="flex items-center gap-2">
            {current?.dbUser ? (
              <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/dashboard">Irányítópult</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
                  <Link href="/login">Bejelentkezés</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/register">Regisztráció</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative flex min-h-screen flex-col overflow-hidden px-6 pt-24 pb-12 text-white sm:pt-28"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(163,230,53,0.18), transparent), radial-gradient(40% 40% at 80% 80%, rgba(163,230,53,0.10), transparent), linear-gradient(180deg, #0A0A0A, #0f0f0f)",
        }}
      >
        <Image
          src="/images/generated/hero-bg.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* SZÖVEG */}
          <div className="text-center lg:text-left">
            <Badge className="mb-6 border-accent/40 bg-accent/20 text-accent">
              ✨ Magyar UGC tartalomgyártók új otthona
            </Badge>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Magyar tartalomgyártók és márkák{" "}
              <span className="text-accent">találkozóhelye</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-balance text-base text-white/75 md:text-lg lg:mx-0">
              Találd meg azokat a TikTok-, Instagram-, YouTube- és Amazon-tartalomkészítőket,
              akik hiteles UGC-videókkal segíthetik márkád vagy ügynökséged kommunikációját.
              Regisztrálj ingyen, böngéssz portfóliókat, vagy add fel a hirdetésed.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/register">Tartalomgyártó vagyok →</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/register">Márkát képviselek →</Link>
              </Button>
            </div>
            <div className="mt-14 grid grid-cols-3 gap-6 lg:max-w-md">
              <Stat value={`${cN[0]?.n ?? 0}`} label="Tartalomgyártó" />
              <Stat value={`${bN[0]?.n ?? 0}`} label="Márka" />
              <Stat value="100%" label="Magyar" />
            </div>
          </div>

          {/* TELEFON KÉP */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-[9/16] w-[300px] overflow-hidden rounded-[2.2rem] border-[3px] border-white/15 bg-black shadow-2xl">
              <Image
                src="/images/generated/hero-phone.webp"
                alt="Tartalomgyártó UGC videót forgat"
                fill
                priority
                className="object-cover"
              />
              {/* phone notch */}
              <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            </div>
            {/* lebegő glow ring */}
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-accent/15 blur-3xl" />
          </div>
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

      {/* NICHE BÖNGÉSZŐ */}
      <NicheBrowser />

      {/* KIEMELT TARTALOMGYÁRTÓK */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Kiemelt tartalomgyártók</h2>
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
          image="/images/generated/feature-brand.webp"
          perks={["Ingyenes böngészés és kapcsolatfelvétel", "Hirdetésfeladás díjmentesen", "Szűrés kategória, követőszám, ár szerint", "Ellenőrzött, értékelt tartalomgyártók"]}
          cta="Márkaként kezdem"
        />
        <SideCard
          title="Tartalomgyártó vagy?"
          image="/images/generated/feature-creator.webp"
          perks={["Ingyenes profil és portfólió", "Pályázz márkák hirdetéseire", "Építsd a hírneved értékelésekkel", "Opcionális kiemelés a directoryban"]}
          cta="Tartalomgyártóként csatlakozom"
          highlight
        />
      </section>

      {/* STATISZTIKA */}
      <section className="bg-[#0A0A0A] py-16 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-8 px-6 text-center">
          <Stat value={`${cN[0]?.n ?? 0}`} label="Aktív tartalomgyártó" />
          <Stat value={`${aN[0]?.n ?? 0}`} label="Aktív hirdetés" />
          <Stat value={`${bN[0]?.n ?? 0}`} label="Regisztrált márka" />
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
  image,
}: {
  title: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
  image?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${highlight ? "border-accent ring-1 ring-accent" : ""}`}>
      {image && (
        <div className="relative h-40 w-full">
          <Image src={image} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="p-8">
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
    </div>
  );
}
