import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  Sparkles,
  Users,
  Building2,
  CreditCard,
  ShieldQuestion,
  Mail,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "GYIK és súgó",
  description:
    "Gyakran ismételt kérdések a Creatorz platformról — alkotóknak (UGC, influencer, modell) és márkáknak.",
};

type QA = { q: string; a: React.ReactNode };
type Group = { icon: typeof HelpCircle; title: string; items: QA[] };

const GROUPS: Group[] = [
  {
    icon: Sparkles,
    title: "A platformról",
    items: [
      {
        q: "Mi az a Creatorz?",
        a: "A Creatorz egy magyar alkotói piactér, amely közvetlenül összeköti az alkotókat (UGC tartalomgyártók, influencerek, modellek, fotósok, operatőrök) a márkákkal. Egy helyen böngészhetsz alkotók között, kapcsolatba léphetsz velük, kampányt adhatsz fel, és pályázhatsz együttműködésekre — közvetítő ügynökség nélkül.",
      },
      {
        q: "Kinek szól a platform?",
        a: "Egyrészt magyar alkotóknak — UGC tartalomgyártóknak, influencereknek, modelleknek, fotósoknak és operatőröknek —, akik munkákat keresnek, megkereséseket kapnának és kampányokra pályáznának. Másrészt márkáknak, cégeknek és vállalkozásoknak, akik kampányt adnak fel, és egy helyen, kényelmesen szűrik a jelentkezőket — nem 50 emailből és Facebook-üzenetből.",
      },
      {
        q: "Miben más, mint egy hagyományos ügynökség?",
        a: "Nálunk nincs közvetítő: a márka és az alkotó közvetlenül egyeztet, gyorsabban és átláthatóbban. A leadott tartalom felhasználási jogai a megállapodásotok szerint nálatok maradnak, és az alkotók követőszámát AI hitelesíti, így valós, naprakész adatokat látsz.",
      },
      {
        q: "Magyar nyelvű a teljes platform?",
        a: "Igen. A felület, az ügyfélszolgálat és minden értesítés magyar nyelvű, az árak pedig forintban (Ft) szerepelnek.",
      },
    ],
  },
  {
    icon: Users,
    title: "Alkotóknak (UGC, influencer, modell, fotós, operatőr)",
    items: [
      {
        q: "Hogyan regisztrálok alkotóként?",
        a: (
          <>
            Kattints a{" "}
            <Link href="/register" className="font-medium text-[#4d7c0f] underline">
              Regisztráció
            </Link>{" "}
            gombra, és válaszd az alkotói regisztrációt, majd a típusodat (UGC
            tartalomgyártó, influencer, modell vagy kreatív szakember). Ezután töltsd
            ki a profilod, add meg a kategóriáidat és a közösségi linkjeidet, majd
            csatold a portfóliódat.
          </>
        ),
      },
      {
        q: "Mennyibe kerül alkotóként?",
        a: "Az alapregisztráció és a profil ingyenes. Emellett választható egy prémium előfizetés (jelenleg 2 990 Ft/hó), amely extra láthatóságot és funkciókat ad. A keresőben való kiemelés egyszeri díjas: 7 nap 4 990 Ft, 30 nap 12 990 Ft. Az aktuális, pontos díjszabást mindig az ÁSZF tartalmazza.",
      },
      {
        q: "Mit jelent a kiemelés?",
        a: "A kiemeléssel a profilod a böngészési találatok elejére kerül egy megkülönböztető jelöléssel, így a márkák nagyobb eséllyel találnak rád. A kiemelés időtartama alatt folyamatosan az élre kerülsz a releváns kategóriákban.",
      },
      {
        q: "Hogyan jutok munkához vagy megkereséshez?",
        a: "Három úton: (1) tölts ki egy erős, portfólióval ellátott profilt, hogy a márkák megtaláljanak és közvetlenül megkeressenek; (2) böngészd a Kampányok oldalt, és pályázz a hozzád illő briefekre; (3) szerezz pozitív értékeléseket, amelyek növelik az esélyeidet a következő együttműködésnél.",
      },
      {
        q: "Honnan tudják a márkák, hogy valós a követőszámom?",
        a: "A megadott közösségi profiljaid alapján rendszerünk automatikusan, AI segítségével frissíti a követőszámaidat néhány naponta. Így a profilod mindig naprakész, hiteles adatokat mutat, amit nem kell kézzel karbantartanod.",
      },
      {
        q: "Mikor írhatok és kaphatok értékelést?",
        a: "Értékelés csak valós együttműködés után születhet: akkor írható, ha egy pályázatot elfogadtak és ténylegesen elindult a közös munka. Ezért a csillagozás minden alkotónál kizárólag valódi visszajelzéseken alapul.",
      },
    ],
  },
  {
    icon: Building2,
    title: "Márkáknak",
    items: [
      {
        q: "Hogyan találok megfelelő alkotót?",
        a: (
          <>
            Az{" "}
            <Link href="/creators" className="font-medium text-[#4d7c0f] underline">
              Alkotók
            </Link>{" "}
            oldalon szűrhetsz típus (UGC, influencer, modell, fotós, operatőr),
            kategória, követőszám, nyelv és helyszín szerint, így pár kattintással
            megtalálod a kampányodhoz illő embert.
          </>
        ),
      },
      {
        q: "Hogyan kezelem a jelentkezőket? Nem kell 50 emailt átnéznem?",
        a: "Nem. A kampányodra érkező pályázók egy helyen, a kampányod alatt jelennek meg — nem szétszórva 50 emailben és Facebook-üzenetben. Egy felületen átnézed, szűröd és összehasonlítod őket (kategória, város, követőszám, értékelés), így gyorsan, időt spórolva választod ki a megfelelőt.",
      },
      {
        q: "Mennyibe kerül a márkáknak a használat?",
        a: "A böngészés, az alkotókkal való kapcsolatfelvétel és a kampány (brief) feladása a márkák számára ingyenes. Csak akkor merül fel költség, ha az alkotóval díjazásban állapodtok meg — ez közvetlenül köztetek dől el.",
      },
      {
        q: "Hogyan adok fel kampányt?",
        a: (
          <>
            Jelentkezz be, lépj az{" "}
            <Link href="/dashboard" className="font-medium text-[#4d7c0f] underline">
              Irányítópultra
            </Link>
            , és hozz létre egy új kampányt. Add meg a kampány célját, kit keresel
            (UGC, influencer, modell, fotós, operatőr), a kategóriát, a formátumot
            és a határidőt — az alkotók pedig pár kattintással pályázhatnak rá.
          </>
        ),
      },
      {
        q: "Nyilvános lesz a bérezés?",
        a: "Nem feltétlenül. A bérezés megjelenítése opcionális: ha nem teszed publikussá, a kampányodnál „Megegyezés szerint” felirat jelenik meg, és a részleteket az alkotóval négyszemközt egyeztetheted.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Fizetés és előfizetés",
    items: [
      {
        q: "Milyen fizetési módot fogadtok el?",
        a: "A fizetés bankkártyával, biztonságosan a Stripe-on keresztül történik, forintban (HUF). A kártyaadataidat soha nem tároljuk a saját rendszerünkben.",
      },
      {
        q: "Hogyan mondhatom le az előfizetésem?",
        a: "Az Irányítópult Előfizetés menüpontjában bármikor lemondhatod. A lemondás után az előfizetésed a már kifizetett időszak végéig aktív marad, utána nem újul meg.",
      },
      {
        q: "Kapok számlát?",
        a: "Igen, minden sikeres fizetésről elektronikus számlát küldünk a regisztrációkor megadott e-mail-címedre.",
      },
      {
        q: "Visszajár a pénzem, ha lemondok?",
        a: (
          <>
            A visszatérítés feltételeit a{" "}
            <Link href="/szabalyzat" className="font-medium text-[#4d7c0f] underline">
              Szabályzatok
            </Link>{" "}
            oldal és az ÁSZF részletezi. Az egyszeri kiemelési díjak a szolgáltatás
            megkezdése után általában nem téríthetők vissza.
          </>
        ),
      },
    ],
  },
  {
    icon: ShieldQuestion,
    title: "Fiók, adatok és technikai",
    items: [
      {
        q: "Elfelejtettem a jelszavam, mit tegyek?",
        a: (
          <>
            A{" "}
            <Link href="/login" className="font-medium text-[#4d7c0f] underline">
              bejelentkezési oldalon
            </Link>{" "}
            kérhetsz jelszó-visszaállítást: e-mailben kapsz egy biztonságos linket
            az új jelszó beállításához.
          </>
        ),
      },
      {
        q: "Hogyan törölhetem a fiókomat?",
        a: (
          <>
            Írj nekünk az{" "}
            <Link href="/kapcsolat" className="font-medium text-[#4d7c0f] underline">
              info@creatorz.hu
            </Link>{" "}
            címre a regisztrált e-mail-címedről, és töröljük a fiókodat, valamint a
            kapcsolódó személyes adataidat a jogszabályi előírásoknak megfelelően.
          </>
        ),
      },
      {
        q: "Hogyan kezelitek az adataimat?",
        a: (
          <>
            Az adataidat a hatályos jogszabályok szerint kezeljük. A részleteket az{" "}
            <Link href="/adatvedelem" className="font-medium text-[#4d7c0f] underline">
              Adatvédelmi tájékoztatóban
            </Link>{" "}
            olvashatod el.
          </>
        ),
      },
      {
        q: "Hibát találtam vagy nem működik valami. Mit tegyek?",
        a: (
          <>
            Nézd meg a{" "}
            <Link href="/status" className="font-medium text-[#4d7c0f] underline">
              Platform státusz
            </Link>{" "}
            oldalt, hogy ismert fennakadásról van-e szó. Ha nem, írj nekünk a hiba
            rövid leírásával — igyekszünk gyorsan megoldani.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#a3e635]/40 bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#4d7c0f]">
          <HelpCircle className="h-3.5 w-3.5" />
          Súgóközpont
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Gyakran ismételt kérdések
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Itt megtalálod a leggyakoribb kérdésekre a választ. Ha valami mégis
          kimaradt, egy üzenet és segítünk.
        </p>
      </div>

      {/* Csoportok */}
      <div className="mt-10 space-y-8">
        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <section key={group.title}>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4e5] text-[#4d7c0f]">
                  <GroupIcon className="h-4 w-4" />
                </span>
                {group.title}
              </h2>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border bg-card transition-colors hover:border-[#a3e635]/40"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold sm:text-base">
                      {item.q}
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 overflow-hidden rounded-2xl border bg-[#0a0a0a] p-6 text-center text-white sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#a3e635]/30 bg-[#a3e635]/10 text-[#a3e635]">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Nem találtad a választ?</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-white/60">
          Írj nekünk, és munkanapokon 24 órán belül válaszolunk.
        </p>
        <Link
          href="/kapcsolat"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#a3e635] px-6 py-3 text-sm font-bold text-black transition-all hover:bg-white"
        >
          Kapcsolatfelvétel
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
