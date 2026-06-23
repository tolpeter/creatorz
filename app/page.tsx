import Link from "next/link";
import Image from "next/image";
import { or, eq, sql } from "drizzle-orm";
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
import {
  CreatorCard,
  type CreatorCardData,
} from "@/components/creator/creator-card";
import { FeaturedCreatorsCarousel } from "@/components/creator/featured-creators-carousel";
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
      or(
        eq(creatorProfiles.isFeatured, true),
        eq(creatorProfiles.isAdminFeatured, true),
      ),
    )
    .orderBy(sql`${creatorProfiles.averageRating} desc nulls last`)
    .limit(6);

  const featured: CreatorCardData[] = featuredRows.map((r) => ({
    ...r,
    categories: r.categories ?? [],
    isFeatured: Boolean(r.isFeatured || r.isAdminFeatured),
  }));


  const steps = [
    {
      icon: UserPlus,
      title: "Regisztrálj",
      desc: "Ingyenes, 2 perc. Tartalomgyártóként vagy márkaként.",
    },
    {
      icon: Search,
      title: "Találd meg a párost",
      desc: "Szűrőkkel a tökéletes tartalomgyártót, vagy pályázz hirdetésre.",
    },
    {
      icon: Handshake,
      title: "Kezdj el dolgozni",
      desc: "Közvetlen kapcsolatfelvétel, együttműködés, értékelés.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <MobileAppPopup enabled={mobileAppPopup} />
      <SiteHeader isLoggedIn={Boolean(current?.dbUser)} />
      <HomeHero />

      {featured.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold">Kiemelt tartalomgyártók</h2>
              <Link
                href="/creators"
                className="text-sm font-semibold text-accent hover:underline"
              >
                Mind megtekintése <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
            {/* Mobil: egysoros, automatikusan úszó + kézzel húzható carousel. */}
            <div className="sm:hidden">
              <FeaturedCreatorsCarousel creators={featured} />
            </div>
            {/* Tablet/asztali: rács. */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <CreatorCard key={c.username} creator={c} />
              ))}
            </div>
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
          title="Márka vagy?"
          image="/images/generated/feature-brand.webp"
          perks={[
            "Ingyenes böngészés és kapcsolatfelvétel",
            "Hirdetésfeladás díjmentesen",
            "Szűrés kategória, követőszám, ár szerint",
            "Ellenőrzött, értékelt tartalomgyártók",
          ]}
          cta="Márkaként kezdem"
        />
        <SideCard
          title="Tartalomgyártó vagy?"
          image="/images/generated/feature-creator.webp"
          perks={[
            "Ingyenes profil és portfólió",
            "Pályázz márkák hirdetéseire",
            "Építsd a hírneved értékelésekkel",
            "Opcionális kiemelés a directoryban",
          ]}
          cta="Tartalomgyártóként csatlakozom"
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

function HomeHero() {
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
        <div className="grid flex-1 items-center gap-1 pt-4 sm:gap-10 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-14">
          {/* Bal: sz\u00f6veg */}
          <div className="min-w-0 max-w-full lg:max-w-[640px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              {"Magyar UGC k\u00f6z\u00f6ss\u00e9g"}
            </div>

            <h1 className="text-balance break-words text-[1.8rem] font-black leading-[1.05] text-white sm:text-5xl sm:leading-[1.02] lg:text-[56px] xl:text-[62px]">
              {"Magyar tartalomgy\u00e1rt\u00f3k \u00e9s m\u00e1rk\u00e1k "}
              <span className="text-accent">{"tal\u00e1lkoz\u00f3helye."}</span>
            </h1>

            <p className="mt-4 max-w-full text-balance text-base leading-7 text-white/70 sm:mt-5 sm:text-lg sm:leading-8 lg:max-w-[560px]">
              {
                "Hiteles UGC tartalomgy\u00e1rt\u00f3k, vide\u00f3v\u00e1g\u00f3k, fot\u00f3sok \u00e9s operat\u0151r\u00f6k egy helyen. Tal\u00e1ld meg a t\u00f6k\u00e9letes partnert, ind\u00edts kamp\u00e1nyt, \u00e9s \u00e9p\u00edts hossz\u00fa t\u00e1v\u00fa egy\u00fcttm\u0171k\u00f6d\u00e9seket."
              }
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-[54px] w-full rounded-full bg-accent px-7 text-base font-bold text-black shadow-[0_0_44px_rgba(163,230,53,0.38)] hover:bg-white sm:w-auto"
              >
                <Link href="/register?role=creator">
                  {"Tartalomgy\u00e1rt\u00f3 vagyok"} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-[54px] w-full rounded-full border-white/20 bg-white/[0.04] px-7 text-base font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/register?role=brand">
                  {"M\u00e1rk\u00e1t k\u00e9pviselek"} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
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
    <div className="relative mx-auto flex h-[280px] w-full min-w-0 max-w-[560px] items-end justify-center sm:h-[520px] lg:h-[600px] lg:max-w-[600px]">
      {/* Lime radi\u00e1lis glow a telefon m\u00f6g\u00f6tt */}
      <div
        aria-hidden
        className="absolute bottom-[18%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent/25 blur-[110px] sm:h-[380px] sm:w-[380px]"
      />

      {/* Vil\u00e1g\u00edt\u00f3 platform-korong a telefon alatt */}
      <Image
        src="/images/home-hero/hero-platform.webp"
        alt=""
        width={1153}
        height={372}
        priority
        sizes="(min-width: 1024px) 440px, 80vw"
        className="absolute bottom-[2%] left-1/2 z-0 h-auto w-[78%] max-w-[300px] -translate-x-1/2 object-contain sm:max-w-[440px]"
      />

      {/* Telefon mockup (m\u00e1r k\u00e9sz, 3D-d\u0151lt eszk\u00f6z) */}
      <Image
        src="/images/home-hero/hero-phone.webp"
        alt={"UGC vide\u00f3 felv\u00e9tel telefonon"}
        width={679}
        height={1241}
        priority
        sizes="(min-width: 1280px) 300px, (min-width: 640px) 270px, 170px"
        className="animate-float relative z-10 h-auto w-[150px] object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:w-[270px] xl:w-[300px]"
      />

      {/* === Lebeg\u0151 k\u00e1rty\u00e1k === */}
      {/* Bal fels\u0151: K\u00f6vet\u0151k */}
      <Image
        src="/images/home-hero/card-followers.webp"
        alt=""
        width={1156}
        height={910}
        sizes="190px"
        className="animate-float absolute left-0 top-[4%] z-20 hidden h-auto w-[170px] rotate-[-3deg] object-contain drop-shadow-2xl md:block xl:w-[190px]"
      />
      {/* Jobb fels\u0151: Akt\u00edv kamp\u00e1ny */}
      <Image
        src="/images/home-hero/card-campaign.webp"
        alt=""
        width={1241}
        height={740}
        sizes="210px"
        className="animate-float absolute right-0 top-[2%] z-20 hidden h-auto w-[185px] rotate-[3deg] object-contain drop-shadow-2xl md:block xl:w-[210px]"
        style={{ animationDelay: "0.3s" }}
      />
      {/* Bal als\u00f3: UGC tartalmak */}
      <Image
        src="/images/home-hero/card-ugc.webp"
        alt=""
        width={1360}
        height={831}
        sizes="215px"
        className="animate-float absolute bottom-[6%] left-[-2%] z-20 hidden h-auto w-[195px] rotate-[3deg] object-contain drop-shadow-2xl lg:block xl:w-[215px]"
        style={{ animationDelay: "0.9s" }}
      />
      {/* Jobb als\u00f3: \u00dczenetek */}
      <Image
        src="/images/home-hero/card-messages.webp"
        alt=""
        width={1049}
        height={698}
        sizes="195px"
        className="animate-float absolute bottom-[12%] right-0 z-20 hidden h-auto w-[180px] rotate-[-3deg] object-contain drop-shadow-2xl lg:block xl:w-[195px]"
        style={{ animationDelay: "1.2s" }}
      />
      {/* Bal k\u00f6z\u00e9p: Elemz\u00e9sek (csak xl) */}
      <Image
        src="/images/home-hero/card-analytics.webp"
        alt=""
        width={1093}
        height={922}
        sizes="150px"
        className="animate-float absolute left-[-3%] top-[42%] z-20 hidden h-auto w-[150px] -rotate-[4deg] object-contain drop-shadow-2xl xl:block"
        style={{ animationDelay: "0.6s" }}
      />
      {/* Jobb k\u00f6z\u00e9p: Megtekint\u00e9sek (csak xl) */}
      <Image
        src="/images/home-hero/card-views.webp"
        alt=""
        width={1197}
        height={803}
        sizes="170px"
        className="animate-float absolute right-[-2%] top-[40%] z-20 hidden h-auto w-[170px] rotate-[4deg] object-contain drop-shadow-2xl xl:block"
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
