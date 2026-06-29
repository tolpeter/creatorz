import Image from "next/image";
import { MessageCircle, BadgeCheck, KeyRound, type LucideIcon } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Találd meg a megfelelő alkotót",
    desc: "Böngéssz UGC tartalomgyártók, influencerek, modellek, fotósok és operatőrök között — ellenőrzött profilok, valós, AI-hitelesített követőszámmal.",
  },
  {
    n: 2,
    title: "Adj fel kampányt, a jelentkezők egy helyre érkeznek",
    desc: "Nem kell 50 emailt és Facebook-üzenetet egyesével átnézned: a pályázók egy felületen jönnek, ahol kategória, város, nyelv és követőszám szerint pár másodperc alatt leszűröd a megfelelőt.",
  },
  {
    n: 3,
    title: "Indítsátok el az együttműködést",
    desc: "Közvetlen üzenet, egyeztetés, leadás és kölcsönös értékelés — közvetítő nélkül, gyorsan, egy helyen követve.",
  },
];

const CARDS: { icon: LucideIcon; emoji: string; title: string; desc: string }[] = [
  {
    icon: MessageCircle,
    emoji: "💬",
    title: "Minden egy helyen",
    desc: "Jelentkezők, üzenetek és a munka állása egyetlen felületen — nem szétszórva 50 emailben és Facebook-üzenetben. Időt és fejfájást spórolsz.",
  },
  {
    icon: BadgeCheck,
    emoji: "🎓",
    title: "Ellenőrzött alkotók",
    desc: "UGC tartalomgyártók, influencerek és modellek, akiknek a követőszámát AI hitelesíti, és a profiljuk valós, naprakész adatokat mutat.",
  },
  {
    icon: KeyRound,
    emoji: "🔑",
    title: "A tartalom a tiéd",
    desc: "A leadott anyagot szabadon felhasználhatod a közösségi médiában, a weboldaladon és a kampányaidban — a jogok nálad maradnak.",
  },
];

export function MarketplaceSection() {
  return (
    <section className="bg-[#f6f7f2] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Alkotói piactér
        </p>
        <h2 className="mt-3 text-balance text-center text-3xl font-black leading-tight sm:text-4xl lg:text-[42px]">
          Találd meg a megfelelő alkotót — és szűrd a jelentkezőket egy helyen
        </h2>

        {/* Kép + 3 számozott pont */}
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.10)]">
            <Image
              src="/images/generated/creatorz-creator-studio.webp"
              alt="Magyar tartalomgyártó UGC videót forgat"
              width={1152}
              height={864}
              sizes="(min-width: 1024px) 540px, 100vw"
              className="h-full w-full object-cover"
            />
          </div>

          <ol className="space-y-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-black text-black">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Alsó kártyák (3 db) */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f4e5]">
                  <Icon className="h-5 w-5 text-[#3f6212]" />
                </span>
                <h3 className="mt-3 text-base font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
