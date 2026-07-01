import Link from "next/link";
import Image from "next/image";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import {
  ArrowRight,
  Check,
  Handshake,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { type CreatorCardData } from "@/components/creator/creator-card";
import { FeaturedExpandingCarousel } from "@/components/creator/featured-expanding-carousel";
import { SiteFooter } from "@/components/layout/site-footer";
import { NicheBrowser } from "@/components/shared/niche-browser";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketplaceSection } from "@/components/shared/marketplace-section";
import { WhyCreatorzSection } from "@/components/shared/why-creatorz-section";
import { MobileAppPopup } from "@/components/shared/mobile-app-popup";
import { getSetting } from "@/lib/settings";

export default async function LandingPage() {
  let current: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    current = await getCurrentUser();
  } catch {
    current = null;
  }

  const mobileAppPopup = await getSetting("mobile_app_popup_enabled").catch(
    () => false,
  );

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
    .where(
      and(
        eq(creatorProfiles.onboardingCompleted, true),
        isNotNull(creatorProfiles.avatarUrl),
      ),
    )
    // Kiemeltek elöl, utána a legjobb értékelésűek — a carousel kitöltéséhez.
    .orderBy(
      sql`(case when ${creatorProfiles.isFeatured} or ${creatorProfiles.isAdminFeatured} then 1 else 0 end) desc`,
      sql`${creatorProfiles.averageRating} desc nulls last`,
    )
    .limit(12);

  const featured: CreatorCardData[] = featuredRows.map((r) => ({
    ...r,
    categories: r.categories ?? [],
    isFeatured: Boolean(r.isFeatured || r.isAdminFeatured),
  }));

  // Social proof: az összes regisztrált felhasználó + 300, 50-re lefelé kerekítve.
  const userCountRow = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .catch(() => [{ c: 0 }]);
  const roundDown50 = (n: number) => Math.max(50, Math.floor(n / 50) * 50);
  const profilesRounded = roundDown50((userCountRow[0]?.c ?? 0) + 300);

  const steps = [
    {
      icon: UserPlus,
      title: "Regisztrálj",
      desc: "Ingyenes, 2 perc. Alkotóként (UGC, influencer, modell, fotós, operatőr) vagy márkaként.",
    },
    {
      icon: Search,
      title: "Találd meg a párost",
      desc: "Márkaként szűrd a megfelelő alkotót és a jelentkezőket; alkotóként pályázz a kampányokra.",
    },
    {
      icon: Handshake,
      title: "Kezdj el dolgozni",
      desc: "Közvetlen kapcsolatfelvétel, együttműködés és kölcsönös értékelés — egy helyen.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <MobileAppPopup enabled={mobileAppPopup} />
      <SiteHeader isLoggedIn={Boolean(current?.dbUser)} />
      <HomeHero profilesRounded={profilesRounded} />

      {featured.length > 0 && (
        <section className="overflow-hidden py-16 sm:py-20">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold">Kiemelt tartalomgyártók</h2>
              <Link
                href="/creators"
                className="text-sm font-semibold text-accent hover:underline"
              >
                Mind megtekintése <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
            {/* "Expanding cards" carousel — asztali és mobil egyaránt. */}
            <FeaturedExpandingCarousel creators={featured} />
          </div>
        </section>
      )}

      <section
        id="hogyan"
        className="relative overflow-hidden border-y bg-muted/20 py-24"
      >
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              3 egyszerű lépés
            </span>
            <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
              Hogyan működik?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pár perc alatt indulhatsz: regisztrálj, és máris dolgozhatsz.
            </p>
          </div>

          <div className="relative">
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
                  <div className="relative mb-6">
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-accent/30 bg-card shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <s.icon className="h-12 w-12 text-accent transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-lg">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/register">
                Indítsd el most <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Alkotói piactér — kép + lépések + kártyák */}
      <MarketplaceSection />

      {/* Miért Creatorz? — 4 kártyás előny-szekció */}
      <WhyCreatorzSection />

      <NicheBrowser />

      <section
        id="markak"
        className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 md:grid-cols-2"
      >
        <SideCard
          title="Márka, cég vagy vállalkozás vagy?"
          image="/images/generated/feature-brand.webp"
          perks={[
            "Ingyenes böngészés és kapcsolatfelvétel",
            "Kampányfeladás díjmentesen",
            "A jelentkezők egy helyen — nem 50 emailben és FB-üzenetben",
            "Szűrés kategória, város, nyelv, követőszám és típus szerint",
          ]}
          cta="Márkaként kezdem"
        />
        <SideCard
          title="Alkotó vagy? (UGC, influencer, modell…)"
          image="/images/generated/feature-creator.webp"
          perks={[
            "Ingyenes profil és portfólió",
            "Pályázz márkák kampányaira",
            "Kapj közvetlen megkereséseket a márkáktól",
            "Építsd a hírneved valós értékelésekkel",
          ]}
          cta="Alkotóként csatlakozom"
          highlight
        />
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative overflow-hidden rounded-lg border bg-card p-8 text-center shadow-sm sm:p-12">
            <div className="relative">
              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Itt vagyunk neked
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Kérdésed van?
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground sm:mx-auto">
                Írj nekünk emailt, 24 órán belül válaszolunk. Bármilyen kérdés,
                visszajelzés, hibabejelentés: itt vagyunk.
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

function HomeHero({ profilesRounded }: { profilesRounded: number }) {
  const fmt = (n: number) => n.toLocaleString("hu-HU");
  return (
    <section className="relative isolate block overflow-hidden bg-[#0a0a0a] px-4 pb-16 pt-4 text-white sm:px-6 sm:pb-14 lg:min-h-[700px] lg:px-8 lg:pb-20">
      <Image
        src="/images/home-hero/hero-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-[0.42]"
      />
      {/* Sötét gradient overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.78)_0%,rgba(10,10,10,0.92)_60%,#0a0a0a_100%)]"
      />
      {/* Két radiális lime glow */}
      <div
        aria-hidden
        className="absolute -left-32 top-32 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[140px] sm:h-[560px] sm:w-[560px]"
      />
      <div
        aria-hidden
        className="absolute -right-20 bottom-10 h-[360px] w-[360px] rounded-full bg-accent/15 blur-[160px] sm:h-[500px] sm:w-[500px]"
      />
      {/* Finom rács */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(163,230,53,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col">
        <div className="grid flex-1 items-center gap-1 pt-4 sm:gap-10 sm:pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:pt-14">
          {/* Bal: sz\u00f6veg */}
          <div className="min-w-0 max-w-full lg:max-w-[640px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              {"Magyar k\u00f6z\u00f6ss\u00e9g"}
            </div>

            <h1 className="break-words font-black uppercase leading-[1.07] text-white text-[1.7rem] sm:text-[2.4rem] lg:text-[2.5rem] xl:text-[3rem]">
              <span className="block">{"Tartalomgy\u00e1rt\u00f3k,"}</span>
              <span className="block">{"Influencerek,"}</span>
              <span className="block">{"Modellek,"}</span>
              <span className="block normal-case font-bold text-accent text-[0.72em] leading-[1.15]">
                {"Fot\u00f3sok, vide\u00f3v\u00e1g\u00f3k, operat\u0151r\u00f6k"}
              </span>
              <span className="block">{"Egy helyen"}</span>
            </h1>

            <p className="mt-5 max-w-full text-balance text-[15px] leading-6 text-white/70 sm:mt-6 sm:text-lg sm:leading-8 lg:max-w-[520px]">
              {
                "Tal\u00e1ld meg a sz\u00e1modra megfelel\u0151 egy\u00fcttm\u0171k\u00f6d\u00e9st, partnert \u2013 an\u00e9lk\u00fcl, hogy fizetn\u00e9l a keres\u00e9s\u00e9rt. Val\u00f3di egy\u00fcttm\u0171k\u00f6d\u00e9sek. Val\u00f3di eredm\u00e9nyek."
              }
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-[54px] w-full rounded-full bg-accent px-7 text-base font-bold text-black shadow-[0_0_44px_rgba(163,230,53,0.38)] hover:bg-white sm:w-auto"
              >
                <Link href="/register?role=creator">
                  {"Regisztr\u00e1lok alkot\u00f3k\u00e9nt"} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-[54px] w-full rounded-full border-white/20 bg-white/[0.04] px-7 text-base font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/register?role=brand">
                  {"Regisztr\u00e1lok m\u00e1rkak\u00e9nt"} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Social proof — a gombok alatt, kicsiben */}
            <p className="mt-5 max-w-full text-xs leading-5 text-white/55 sm:text-sm lg:max-w-[520px]">
              {"Több mint "}
              <span className="font-bold text-white">{fmt(profilesRounded)}+</span>
              {" márka, cég, influencer, tartalomgyártó és modell választotta a "}
              <span className="font-bold text-accent">Creatorz</span>
              {"-t"}
            </p>
          </div>

          {/* Jobb: telefon mockup */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/**
 * Hero vizu\u00e1l: a k\u00e9sz telefon-mockup a vil\u00e1g\u00edt\u00f3 platform-korongon \u00e1ll,
 * k\u00f6r\u00fcl\u00f6tte a c\u00e9lzottan renderelt lebeg\u0151 UI-k\u00e1rty\u00e1k.
 * A k\u00e1rty\u00e1k progressz\u00edven jelennek meg (md \u2192 lg \u2192 xl), mobilon tiszta
 * a kompoz\u00edci\u00f3: csak a telefon + platform + glow l\u00e1tszik.
 */
function HeroVisual() {
  return (
    <div className="relative mx-auto flex h-[380px] w-full min-w-0 max-w-[560px] items-center justify-center sm:h-[620px] lg:h-[770px] lg:max-w-[700px] xl:max-w-[780px]">
      {/* Lime radi\u00e1lis glow a telefon m\u00f6g\u00f6tt */}
      <div
        aria-hidden
        className="absolute bottom-[14%] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px] sm:h-[420px] sm:w-[420px]"
      />

      {/* Vil\u00e1g\u00edt\u00f3 platform-korong a telefon talp\u00e1n\u00e1l */}
      <Image
        src="/images/home-hero/hero-platform.webp"
        alt=""
        width={1153}
        height={372}
        priority
        sizes="(min-width: 1024px) 520px, 85vw"
        className="absolute bottom-[5%] left-1/2 z-0 h-auto w-[84%] max-w-[340px] -translate-x-1/2 object-contain sm:max-w-[500px] lg:max-w-[560px]"
      />

      {/* K\u00f6zponti telefon mockup (k\u00e9sz, 3D-d\u0151lt eszk\u00f6z) */}
      <Image
        src="/images/home-hero-2/phone.webp"
        alt={"Creatorz alkot\u00f3 a telefon k\u00e9perny\u0151j\u00e9n"}
        width={780}
        height={1040}
        priority
        sizes="(min-width: 1280px) 320px, (min-width: 640px) 280px, 200px"
        className="animate-float relative z-10 h-auto w-[240px] object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:w-[330px] lg:w-[350px] xl:w-[395px]"
      />

      {/* === Lebeg\u0151 kateg\u00f3ria-k\u00e1rty\u00e1k (a l\u00e1tv\u00e1nyterv elrendez\u00e9se) === */}
      {/* Bal fels\u0151: Influencerek */}
      <Image
        src="/images/home-hero-2/card-influencer.webp"
        alt="Influencerek"
        width={540}
        height={600}
        sizes="160px"
        className="animate-float absolute left-[1%] top-0 z-20 hidden h-auto w-[160px] rotate-[-5deg] object-contain drop-shadow-2xl md:block xl:w-[182px]"
      />
      {/* Jobb fels\u0151: Fot\u00f3sok */}
      <Image
        src="/images/home-hero-2/card-photographer.webp"
        alt="Fot\u00f3sok"
        width={540}
        height={540}
        sizes="160px"
        className="animate-float absolute right-[1%] top-0 z-20 hidden h-auto w-[160px] rotate-[4deg] object-contain drop-shadow-2xl md:block xl:w-[180px]"
        style={{ animationDelay: "0.4s" }}
      />
      {/* Bal k\u00f6z\u00e9p: Modellek */}
      <Image
        src="/images/home-hero-2/card-model.webp"
        alt="Modellek"
        width={540}
        height={620}
        sizes="155px"
        className="animate-float absolute left-0 top-[35%] z-20 hidden h-auto w-[154px] -rotate-[5deg] object-contain drop-shadow-2xl lg:block xl:w-[175px]"
        style={{ animationDelay: "0.9s" }}
      />
      {/* Jobb k\u00f6z\u00e9p: Vide\u00f3v\u00e1g\u00f3k */}
      <Image
        src="/images/home-hero-2/card-editor.webp"
        alt="Vide\u00f3v\u00e1g\u00f3k"
        width={560}
        height={520}
        sizes="165px"
        className="animate-float absolute right-[-1%] top-[32%] z-20 hidden h-auto w-[163px] rotate-[5deg] object-contain drop-shadow-2xl lg:block xl:w-[186px]"
        style={{ animationDelay: "0.6s" }}
      />
      {/* Bal als\u00f3: Tartalomgy\u00e1rt\u00f3k */}
      <Image
        src="/images/home-hero-2/card-ugc.webp"
        alt="Tartalomgy\u00e1rt\u00f3k"
        width={560}
        height={560}
        sizes="160px"
        className="animate-float absolute bottom-0 left-[4%] z-30 hidden h-auto w-[168px] rotate-[2deg] object-contain drop-shadow-2xl lg:block xl:w-[189px]"
        style={{ animationDelay: "1.2s" }}
      />
      {/* Jobb als\u00f3: Operat\u0151r\u00f6k */}
      <Image
        src="/images/home-hero-2/card-operator.webp"
        alt="Operat\u0151r\u00f6k"
        width={560}
        height={520}
        sizes="160px"
        className="animate-float absolute bottom-[1%] right-0 z-20 hidden h-auto w-[163px] -rotate-[4deg] object-contain drop-shadow-2xl xl:block xl:w-[182px]"
        style={{ animationDelay: "1.5s" }}
      />
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
    <div
      className={`overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md ${
        highlight ? "border-accent ring-1 ring-accent" : ""
      }`}
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
