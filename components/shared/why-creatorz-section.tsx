import Link from "next/link";
import {
  Sparkles,
  Clapperboard,
  Rocket,
  Trophy,
  FolderHeart,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const CARDS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    icon: Clapperboard,
    title: "Bármilyen típusú tartalom",
    desc: "Szerezz bármilyen videót, képet vagy közösségi média bejegyzést, amire szükséged van — a márkádhoz igazítva.",
    href: "/creators",
  },
  {
    icon: Rocket,
    title: "Gyors és egyszerű",
    desc: "Adj fel briefet percek alatt, és néhány napon belül megkapod a tartalmat — gyorsan és zökkenőmentesen.",
    href: "/register",
  },
  {
    icon: Trophy,
    title: "Alkotói szintek",
    desc: "A kezdőktől a profikig: alkotóink az elvégzett munkák és a kapott értékelések alapján lépnek szintet.",
    href: "/creators",
  },
  {
    icon: FolderHeart,
    title: "Alkotói portfóliók",
    desc: "Böngéssz az alkotók portfóliói között, nézd meg a korábbi munkáikat, és ellenőrizd az értékeléseiket.",
    href: "/creators",
  },
];

export function WhyCreatorzSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      {/* finom pötty-dekoráció bal felül */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-8 h-24 w-32 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
          color: "#a3e635",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Eyebrow pill */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-[#f0f4e5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#3f6212]">
            <Sparkles className="h-3.5 w-3.5" />
            Miért Creatorz?
          </span>
        </div>

        <h2 className="mt-4 text-balance text-center text-3xl font-black leading-tight sm:text-4xl lg:text-[42px]">
          Miért válaszd a <span className="text-[#4d7c0f]">Creatorz</span>{" "}
          platformot?
        </h2>
        <p className="mt-3 text-center text-base text-muted-foreground">
          Minden, amire szükséged van a minőségi tartalomkészítéshez — egy
          helyen.
        </p>
        <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-accent" />

        {/* 4 kártya */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className="group flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f4e5] ring-1 ring-accent/20">
                  <Icon className="h-8 w-8 text-[#4d7c0f]" />
                </span>
                <span className="mt-4 block h-1 w-8 rounded-full bg-accent" />
                <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">
                  {c.desc}
                </p>
                <span className="mt-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#4d7c0f] transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-black">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
