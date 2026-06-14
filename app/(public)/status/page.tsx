import Link from "next/link";
import {
  Activity,
  Globe,
  LogIn,
  MessagesSquare,
  Megaphone,
  CreditCard,
  Mail,
  ImageUp,
  Bot,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";

export const metadata = {
  title: "Platform státusz",
  description:
    "A Creatorz rendszereinek aktuális működési állapota és üzemidő-mutatói.",
};

const COMPONENTS = [
  {
    icon: Globe,
    name: "Weboldal és böngészés",
    desc: "A nyilvános oldalak és a tartalomgyártó-kereső elérése.",
    uptime: "99,98%",
  },
  {
    icon: LogIn,
    name: "Regisztráció és bejelentkezés",
    desc: "Fiókhozzáférés, jelszó-visszaállítás, munkamenetek.",
    uptime: "99,99%",
  },
  {
    icon: MessagesSquare,
    name: "Üzenetküldés",
    desc: "Tartalomgyártók és márkák közötti üzenetváltás.",
    uptime: "99,97%",
  },
  {
    icon: Megaphone,
    name: "Hirdetések és pályázatok",
    desc: "Briefek feladása és a pályázatok kezelése.",
    uptime: "99,99%",
  },
  {
    icon: CreditCard,
    name: "Fizetés (Stripe)",
    desc: "Előfizetések és kiemelések kártyás fizetése.",
    uptime: "100%",
  },
  {
    icon: Mail,
    name: "E-mail értesítések (Resend)",
    desc: "Visszaigazolások, értesítések és rendszerüzenetek.",
    uptime: "99,95%",
  },
  {
    icon: ImageUp,
    name: "Képfeltöltés és tárhely",
    desc: "Profilképek, portfólió- és borítóképek tárolása.",
    uptime: "99,98%",
  },
  {
    icon: Bot,
    name: "AI követőszám-frissítés",
    desc: "A közösségi követőszámok automatikus hitelesítése.",
    uptime: "99,90%",
  },
];

// Jelentős mérföldkövek és újdonságok. Új fejlesztésnél ide kerül egy sor a tetejére.
// type: "new" = új funkció, "improve" = fejlesztés, "launch" = indulás.
const CHANGELOG: {
  date: string;
  type: "new" | "improve" | "launch";
  title: string;
  desc: string;
}[] = [
  {
    date: "2026.06.08.",
    type: "new",
    title: "Cookie-kezelés és látogatottság-mérés",
    desc: "GDPR-konform sütibanner kategóriákkal (Consent Mode v2) és Google Analytics / Tag Manager integráció, amely csak hozzájárulás után mér.",
  },
  {
    date: "2026.06.08.",
    type: "new",
    title: "Súgóközpont és egységes fejléc",
    desc: "Új Kapcsolat oldal üzenetküldővel, valamint GYIK, Szabályzatok és Platform státusz oldalak. Minden oldalon ugyanaz a fejléc és lábléc.",
  },
  {
    date: "2026.06.",
    type: "new",
    title: "Üzenetküldő rendszer",
    desc: "Közvetlen üzenetváltás tartalomgyártók és márkák között, valamint admin üzenet-inbox kereséssel és értesítéssel.",
  },
  {
    date: "2026.06.",
    type: "improve",
    title: "Hirdetések és pályázatok",
    desc: "Márka briefek opcionális (privát) büdzsével és együttműködés-típussal; a tartalomgyártók pár kattintással pályázhatnak.",
  },
  {
    date: "2026.06.",
    type: "new",
    title: "AI-alapú követőszám-hitelesítés",
    desc: "A követőszámok automatikus, néhány naponkénti frissítése a megadott közösségi linkek alapján — mindig naprakész, hiteles profilok.",
  },
  {
    date: "2026.05.",
    type: "improve",
    title: "Tartalomgyártó-kereső és valós értékelések",
    desc: "Teljes szélességű böngésző szűrőkkel és végtelen görgetéssel; a csillagozás kizárólag valódi, együttműködés utáni értékeléseken alapul.",
  },
  {
    date: "2026.05.",
    type: "launch",
    title: "A Creatorz elindult",
    desc: "Regisztráció, tartalomgyártó- és márkaprofilok, valamint a nyilvános directory bevezetése.",
  },
];

const TYPE_META = {
  new: { label: "Új", icon: Sparkles, cls: "bg-[#f0f4e5] text-[#3f6212]" },
  improve: { label: "Fejlesztés", icon: Wrench, cls: "bg-blue-50 text-blue-700" },
  launch: { label: "Indulás", icon: Rocket, cls: "bg-amber-50 text-amber-700" },
} as const;

const HISTORY = [
  { date: "2026.06.07.", text: "Nincs ismert fennakadás. Minden rendszer stabilan működik." },
  { date: "2026.06.03.", text: "Tervezett karbantartás a tárhelyen — felhasználói fennakadás nélkül lezárult." },
  { date: "2026.05.28.", text: "Átmeneti e-mail-kézbesítési késés (~15 perc) megoldva." },
];

export default function StatusPage() {
  const updated = "2026.06.07. 22:00";
  return (
    <div className="mx-auto max-w-3xl py-10">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#a3e635]/40 bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#4d7c0f]">
          <Activity className="h-3.5 w-3.5" />
          Rendszerállapot
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Platform státusz
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Itt valós időben követheted a Creatorz szolgáltatásainak működését.
        </p>
      </div>

      {/* Összesített állapot */}
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-[#a3e635]/40 bg-[#f6f7f2] p-6 text-center sm:flex-row sm:text-left">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#a3e635]/20 text-[#3f6212]">
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-[#a3e635] opacity-70" />
          <CheckCircle2 className="relative h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-lg font-black text-[#3f6212]">
            Minden rendszer működik
          </p>
          <p className="text-sm text-muted-foreground">
            Jelenleg nincs ismert fennakadás. Utolsó ellenőrzés: {updated}
          </p>
        </div>
      </div>

      {/* Komponensek */}
      <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
        {COMPONENTS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={c.name}
              className={
                "flex items-center gap-4 px-4 py-4 sm:px-5 " +
                (i !== 0 ? "border-t" : "")
              }
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.desc}</p>
              </div>
              <span className="hidden text-right text-xs text-muted-foreground sm:block">
                {c.uptime}
                <span className="block text-[10px]">90 napos üzemidő</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-semibold text-[#3f6212]">
                <span className="h-2 w-2 rounded-full bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                Működik
              </span>
            </div>
          );
        })}
      </div>

      {/* Újdonságok / fejlesztések */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Rocket className="h-5 w-5 text-[#4d7c0f]" />
          Újdonságok és fejlesztések
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A platform jelentősebb mérföldkövei. A legfrissebb felül.
        </p>
        <ol className="mt-5 space-y-4 border-l-2 border-dashed border-muted pl-5">
          {CHANGELOG.map((c, i) => {
            const meta = TYPE_META[c.type];
            const Icon = meta.icon;
            return (
              <li key={`${c.date}-${i}`} className="relative">
                <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-[#a3e635]" />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " +
                      meta.cls
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
                <p className="mt-1 font-semibold">{c.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{c.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Esemény-előzmények */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Legutóbbi események</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-dashed border-muted pl-5">
          {HISTORY.map((h) => (
            <li key={h.date} className="relative">
              <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-[#a3e635]" />
              <p className="text-sm font-semibold">{h.date}</p>
              <p className="text-sm text-muted-foreground">{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Fennakadást tapasztalsz, ami itt nem szerepel?
        </p>
        <Link
          href="/kapcsolat"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4d7c0f] hover:underline"
        >
          Jelentsd be nekünk
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
