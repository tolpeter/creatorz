import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  Cookie,
  Users,
  RotateCcw,
  ArrowRight,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const metadata = {
  title: "Szabályzatok",
  description:
    "A Creatorz platform szabályzatai: ÁSZF, adatvédelem, sütik, közösségi irányelvek és visszatérítés.",
};

const DOCS = [
  {
    icon: Scale,
    title: "Általános Szerződési Feltételek",
    desc: "A platform használatának jogi keretei: regisztráció, előfizetés, jogok és kötelezettségek.",
    href: "/aszf",
  },
  {
    icon: ShieldCheck,
    title: "Adatvédelmi tájékoztató",
    desc: "Hogyan gyűjtjük, kezeljük és védjük a személyes adataidat, és milyen jogaid vannak.",
    href: "/adatvedelem",
  },
  {
    icon: Cookie,
    title: "Süti (cookie) tájékoztató",
    desc: "Milyen sütiket használunk a működéshez és a felhasználói élmény javításához.",
    href: "/cookies",
  },
];

const COMMUNITY_OK = [
  "Valós, naprakész adatok a profilodban (követőszám, portfólió, kategóriák).",
  "Tiszteletteljes, szakmai kommunikáció a másik féllel.",
  "A megállapodás betartása: határidők, leadási feltételek, díjazás.",
  "Eredeti tartalom, amelynek felhasználási jogával rendelkezel.",
];

const COMMUNITY_NO = [
  "Megtévesztő adatok, vásárolt vagy hamis követők, mások portfóliójának átvétele.",
  "Zaklatás, gyűlöletkeltés, diszkrimináció vagy bármilyen jogsértő tartalom.",
  "A platform megkerülése csalárd szándékkal, illetve spam és átverés.",
  "Szerzői jogot vagy harmadik fél jogait sértő anyagok feltöltése.",
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#a3e635]/40 bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#4d7c0f]">
          <FileText className="h-3.5 w-3.5" />
          Átláthatóság
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Szabályzatok
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Minden, ami a platform jogi és működési kereteit meghatározza —
          érthetően összegyűjtve egy helyen.
        </p>
      </div>

      {/* Dokumentum-kártyák */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {DOCS.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex flex-col rounded-2xl border bg-card p-5 transition-all hover:border-[#a3e635]/50 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f4e5] text-[#4d7c0f]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-base font-bold leading-snug">{doc.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">
                {doc.desc}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7c0f]">
                Megnyitás
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Közösségi irányelvek */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
            <Users className="h-5 w-5" />
          </span>
          Közösségi irányelvek
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A Creatorz akkor működik jól, ha a tartalomgyártók és a márkák
          tisztességesen, kiszámíthatóan és tisztelettel dolgoznak együtt. Az
          alábbi alapelvek minden felhasználóra vonatkoznak.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#a3e635]/30 bg-[#f6f7f2] p-5">
            <h3 className="flex items-center gap-2 font-bold text-[#3f6212]">
              <CheckCircle2 className="h-5 w-5" />
              Amit elvárunk
            </h3>
            <ul className="mt-3 space-y-2.5">
              {COMMUNITY_OK.map((t) => (
                <li key={t} className="flex gap-2 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4d7c0f]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
            <h3 className="flex items-center gap-2 font-bold text-red-700">
              <XCircle className="h-5 w-5" />
              Amit tiltunk
            </h3>
            <ul className="mt-3 space-y-2.5">
              {COMMUNITY_NO.map((t) => (
                <li key={t} className="flex gap-2 text-sm leading-6">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 rounded-xl border bg-card p-4 text-sm leading-6 text-muted-foreground">
          Az irányelvek megsértése a tartalom eltávolítását, a fiók
          felfüggesztését vagy végleges törlését vonhatja maga után. Bejelentést a{" "}
          <Link href="/kapcsolat" className="font-medium text-[#4d7c0f] underline">
            kapcsolati oldalon
          </Link>{" "}
          tehetsz.
        </p>
      </section>

      {/* Visszatérítés */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
            <RotateCcw className="h-5 w-5" />
          </span>
          Visszatérítés és lemondás
        </h2>
        <div className="mt-4 space-y-3 rounded-2xl border bg-card p-5 text-sm leading-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Előfizetés lemondása.</strong> A
            havi előfizetésedet bármikor lemondhatod az Irányítópulton. A lemondás
            után a szolgáltatás a már kifizetett időszak végéig elérhető marad,
            ezután nem újul meg, és további díjat nem számítunk fel.
          </p>
          <p>
            <strong className="text-foreground">Kiemelési díjak.</strong> A
            profilkiemelés egyszeri, azonnal igénybe vehető szolgáltatás. Mivel a
            teljesítés a megrendeléssel azonnal megkezdődik, az elindított kiemelés
            díja utólag általában nem téríthető vissza.
          </p>
          <p>
            <strong className="text-foreground">Elállási jog.</strong> A
            fogyasztókat megillető elállási és felmondási jogokról, valamint a
            kivételekről részletesen az{" "}
            <Link href="/aszf" className="font-medium text-[#4d7c0f] underline">
              ÁSZF
            </Link>{" "}
            rendelkezik.
          </p>
          <p>
            <strong className="text-foreground">Hibás teljesítés.</strong> Ha
            technikai hiba miatt nem kaptad meg a kifizetett szolgáltatást, írj
            nekünk — kivizsgáljuk, és indokolt esetben jóváírjuk vagy
            visszatérítjük.
          </p>
        </div>
      </section>

      {/* Lábjegyzet */}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        A szabályzatok sablonjellegűek; éles üzemeltetés előtt jogi
        felülvizsgálat szükséges. Utolsó frissítés: 2026.06.07.
      </p>
    </div>
  );
}
