"use client";

import Link from "next/link";
import {
  ArrowRight,
  Handshake,
  Zap,
  Filter,
  BadgeCheck,
  Rocket,
  Quote,
  Smartphone,
  Wallet,
  Globe2,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/public/reveal";

const VALUES = [
  {
    icon: Handshake,
    title: "Egyenrangúság",
    desc: "Az alkotók és a márkák egyenrangú felek — senki ne legyen kiszolgáltatva senkinek.",
  },
  {
    icon: Zap,
    title: "Közvetítő nélkül",
    desc: "Nincs horribilis ügynökségi jutalék; egy kattintással lehet pályázni a kampányokra.",
  },
  {
    icon: Filter,
    title: "Rend a káosz helyett",
    desc: "A márkák nem emaileket és Facebook-üzeneteket bogarásznak — a jelentkezőket egy helyen, korra, nemre, kategóriára és követőszámra szűrik.",
  },
  {
    icon: BadgeCheck,
    title: "Valódi szakértelem",
    desc: "A kategóriák alapján látszik, ki mivel foglalkozik ténylegesen — nem a „mindenre jelentkezők” kerülnek előtérbe.",
  },
  {
    icon: Rocket,
    title: "Esélyegyenlőség",
    desc: "A feltörekvő, kis követőszámú alkotó ugyanúgy esélyt kap, mint egy nagy elérésű név.",
  },
];

const FUTURE = [
  { icon: Smartphone, label: "Natív mobilalkalmazás", sub: "Android & iOS" },
  { icon: Wallet, label: "Bővülő bevételi csomagok", sub: "Alkotóknak és márkáknak" },
  { icon: Globe2, label: "Régiós terjeszkedés", sub: "A magyar piacon túl" },
];

const HERO_WORDS = ["A", "Creatorz", "története"];

export function AboutPage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* ================= HERO (dark) ================= */}
      <section className="relative isolate overflow-hidden bg-[#0a0a0a] text-white">
        {/* animált blob háttér */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute -left-20 top-[-10%] h-72 w-72 rounded-full bg-accent/20 blur-[90px]" />
          <div
            className="animate-blob absolute right-[-6%] top-[20%] h-80 w-80 rounded-full bg-emerald-400/15 blur-[100px]"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="animate-blob absolute bottom-[-20%] left-1/3 h-72 w-72 rounded-full bg-accent/15 blur-[90px]"
            style={{ animationDelay: "-11s" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(163,230,53,0.10),transparent_55%)]" />
          {/* finom rács */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(circle at 50% 30%, black, transparent 75%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <span className="animate-slide-up inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Rólunk
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            {HERO_WORDS.map((w, i) => (
              <span
                key={i}
                className="animate-word-in mr-3 inline-block"
                style={{ animationDelay: `${0.15 + i * 0.13}s`, animationFillMode: "both" }}
              >
                {w === "Creatorz" ? <span className="text-accent">{w}</span> : w}
              </span>
            ))}
          </h1>

          <p
            className="animate-slide-up mx-auto mt-6 max-w-2xl text-lg text-white/70"
            style={{ animationDelay: "0.6s" }}
          >
            UGC tartalomgyártók, influencerek, modellek, fotósok és operatőrök — és a
            márkák, akik dolgoznának velük. <span className="text-white">Egy helyen.</span>
          </p>

          <div
            className="animate-slide-up mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.8s" }}
          >
            <Link
              href="/register"
              className="animate-glow inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-bold text-black transition-colors hover:bg-white"
            >
              Csatlakozz <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/creators"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
            >
              Alkotók böngészése
            </Link>
          </div>
        </div>

        {/* alsó ív */}
        <div className="h-10 rounded-t-[2.5rem] bg-white" />
      </section>

      {/* ================= ALAPÍTÓ (light) ================= */}
      <section className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
          <Reveal className="mx-auto md:mx-0">
            <div className="relative">
              <div className="animate-float flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[#0a0a0a] text-4xl font-black text-accent shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                TP
              </div>
              <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black shadow-lg">
                <BadgeCheck className="h-5 w-5" />
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f6212]">
              Az alapító
            </p>
            <blockquote className="relative mt-3">
              <Quote className="absolute -left-1 -top-3 h-8 w-8 text-accent/40" />
              <p className="relative text-xl font-medium leading-relaxed text-[#18181b] sm:text-2xl">
                Egy olyan platformot akartam létrehozni, amely egyszerre képviseli a
                tartalomgyártókat, influencereket, modelleket és a márkákat — hogy{" "}
                <span className="bg-accent/25 px-1">senki ne legyen kiszolgáltatva senkinek</span>.
              </p>
            </blockquote>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              A cél, hogy mindenki gördülékenyen találjon munkát és a munkájához megfelelő
              partnert, anélkül, hogy horribilis összegeket kellene ügynökségeknek fizetnie.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#18181b]">
              Tölgyesi Péter{" "}
              <span className="font-normal text-muted-foreground">
                — a Creatorz megálmodója, alapítója és megvalósítója
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= KÜLDETÉS (dark, glow) ================= */}
      <section className="relative isolate overflow-hidden bg-[#0a0a0a] py-24 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute left-1/4 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(163,230,53,0.10),transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Küldetésünk
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 text-2xl font-black leading-snug tracking-tight sm:text-[2.1rem]">
              Átláthatóvá és elérhetővé tenni a magyar tartalomgyártó-piacot — hogy{" "}
              <span className="text-accent">bárki</span>, akinek van közönsége vagy tehetsége,
              munkát találjon, és <span className="text-accent">bármely cég</span> pillanatok
              alatt megtalálja a megfelelő alkotót.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mx-auto mt-8 h-1 w-24 origin-left rounded-full bg-accent" />
          </Reveal>
        </div>
      </section>

      {/* ================= AMIT KÉPVISELÜNK (light) ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f6212]">
            Amit képviselünk
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            A Creatorz mögött álló alapelvek
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((val, i) => {
            const Icon = val.icon;
            return (
              <Reveal key={val.title} delay={i * 90}>
                <div className="group h-full rounded-3xl border border-black/10 bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4dc] text-[#3f6212] transition-colors group-hover:bg-accent group-hover:text-black">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{val.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {val.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}

          {/* 6. cella: kiemelt statisztika-kártya */}
          <Reveal delay={VALUES.length * 90}>
            <div className="flex h-full flex-col justify-center rounded-3xl bg-[#0a0a0a] p-6 text-white">
              <p className="text-4xl font-black text-accent">80%</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                A nem illeszkedő jelentkezők akár ekkora része is kiszűrhető egyetlen
                felületen — kor, nem, kategória és követőszám szerint.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= VÍZIÓ (soft gradient) ================= */}
      <section className="relative overflow-hidden bg-[#f6f7f2] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f6212]">
              A vízió
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-2xl font-black leading-snug tracking-tight sm:text-3xl">
              Egy olyan magyar alkotói ökoszisztéma, ahol a{" "}
              <span className="text-[#4d7c0f]">tehetség és a közönség</span> számít — nem a
              kapcsolatok vagy a közvetítői díjak.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {FUTURE.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.label} delay={i * 110}>
                  <div className="group flex h-full items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4dc] text-[#3f6212] transition-colors group-hover:bg-accent group-hover:text-black">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold leading-tight">{f.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{f.sub}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CTA (dark) ================= */}
      <section className="relative isolate overflow-hidden bg-[#0a0a0a] py-20 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Csatlakozz a Creatorz-hoz
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Akár alkotó vagy, akár márkaként keresel valakit — pár perc, és elindulhatsz.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-bold text-black transition-colors hover:bg-white"
              >
                Regisztráció <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/kapcsolat"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
              >
                Kapcsolat
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
