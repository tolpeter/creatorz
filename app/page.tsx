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
    { icon: UserPlus, title: "Regisztrálj", desc: "Ingyenes, 2 perc. Tartalomgyártóként vagy márkaként." },
    { icon: Search, title: "Találd meg a párost", desc: "Szűrőkkel a tökéletes tartalomgyártót, vagy pályázz hirdetésre." },
    { icon: Handshake, title: "Kezdj el dolgozni", desc: "Közvetlen kapcsolatfelvétel, együttműködés, értékelés." },
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
                src="/images/generated/hero-phone.webp?v=2"
                alt="Tartalomgyártó UGC videót forgat"
                fill
                priority
                unoptimized
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

      {/* HOGYAN MŰKÖDIK — animált */}
      <section
        id="hogyan"
        className="relative overflow-hidden py-24"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(163,230,53,0.12), transparent), linear-gradient(180deg, transparent, rgba(10,10,10,0.04))",
        }}
      >
        {/* lebegő háttér-pontok */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute left-[8%] top-[20%] h-2 w-2 animate-float rounded-full bg-accent/70" />
          <span
            className="absolute right-[12%] top-[40%] h-1.5 w-1.5 animate-float rounded-full bg-accent/50"
            style={{ animationDelay: "1.2s" }}
          />
          <span
            className="absolute left-[20%] bottom-[18%] h-2.5 w-2.5 animate-float rounded-full bg-accent/40"
            style={{ animationDelay: "0.6s" }}
          />
          <span
            className="absolute right-[25%] bottom-[28%] h-1 w-1 animate-float rounded-full bg-accent/60"
            style={{ animationDelay: "1.8s" }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              3 egyszerű lépés
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Hogyan működik?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pár perc alatt indulhatsz — regisztrálj és máris dolgozhatsz.
            </p>
          </div>

          <div className="relative">
            {/* Háttér-vonal a desktopon (a 3 lépést összekötő szaggatott neon vonal) */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-[16%] right-[16%] top-[68px] hidden md:block"
            >
              <div className="animate-line h-px w-full bg-gradient-to-r from-accent/0 via-accent/70 to-accent/0" />
            </div>

            <div className="relative grid gap-10 md:grid-cols-3">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="animate-slide-up group relative flex flex-col items-center text-center"
                  style={{ animationDelay: `${i * 160}ms` }}
                >
                  {/* Sorszám-badge + ikon — kettős kör pulzáló glow-val */}
                  <div className="relative mb-6">
                    <div className="animate-glow relative flex h-32 w-32 items-center justify-center rounded-full border border-accent/30 bg-gradient-to-br from-accent/15 via-card to-card shadow-lg transition-transform duration-300 group-hover:scale-105">
                      <s.icon className="h-12 w-12 text-accent transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-lg">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/register">Indítsd el most →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KATEGÓRIA BÖNGÉSZŐ */}
      <NicheBrowser />

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
          delay="1.7s"
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

      {/* KAPCSOLAT */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative">
              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Itt vagyunk neked
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Kérdésed van?
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground sm:mx-auto">
                Írj nekünk emailt, 24 órán belül válaszolunk. Bármilyen kérdés,
                visszajelzés, hibabejelentés — itt vagyunk.
              </p>
              <a
                href="mailto:info@creatorz.hu"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-foreground transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-[0_0_24px_rgba(163,230,53,0.4)]"
              >
                info@creatorz.hu
              </a>
              <p className="mt-4 text-xs text-muted-foreground">
                Vagy nézd meg a{" "}
                <Link href="/kapcsolat" className="text-accent underline">
                  kapcsolat oldalt
                </Link>
                .
              </p>
            </div>
          </div>
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
  delay,
}: {
  title: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
  image?: string;
  delay?: string;
}) {
  return (
    <div
      className={`animate-float overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-xl ${highlight ? "border-accent ring-1 ring-accent" : ""}`}
      style={{ animationDelay: delay }}
    >
      {image && (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
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
