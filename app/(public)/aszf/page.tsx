import { LegalPage } from "@/components/layout/legal-page";

export const metadata = { title: "ÁSZF", description: "Általános Szerződési Feltételek" };

export default function TermsPage() {
  return (
    <LegalPage title="Általános Szerződési Feltételek" updated="2026.06.01.">
      <p className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-900 dark:text-yellow-200">
        ⚠️ Sablonszöveg — élesítés előtt ügyvéddel pontosítandó.
      </p>

      <h2>1. Általános rendelkezések</h2>
      <p>A jelen ÁSZF a Creatorz.hu szolgáltatás használatára vonatkozik.</p>

      <h2>2. Szolgáltatás leírása</h2>
      <p>
        A Creatorz.hu egy magyar UGC tartalomgyártókat és márkákat összekötő directory + subscription
        platform.
      </p>

      <h2>3. Felhasználói típusok</h2>
      <ul>
        <li><strong>Creator:</strong> tartalomgyártó, aki márkákkal szeretne dolgozni.</li>
        <li><strong>Márka (brand):</strong> cég, aki creatort keres tartalmakhoz.</li>
      </ul>

      <h2>4. Regisztráció</h2>
      <p>
        A regisztráció ingyenes. A felhasználó valós adatokat köteles megadni. A fiókod biztonságáért
        te felelsz.
      </p>

      <h2>5. Előfizetések és fizetési feltételek</h2>
      <ul>
        <li>Creator havi előfizetés: 2 490 Ft/hó (opcionális, az admin által szabályozott).</li>
        <li>Kiemelés 7 nap: 3 990 Ft (egyszeri).</li>
        <li>Kiemelés 30 nap: 5 990 Ft (egyszeri).</li>
        <li>Fizetés a Stripe-on keresztül, HUF-ban.</li>
      </ul>

      <h2>6. Felhasználói tartalom és jogok</h2>
      <p>
        A felhasználó által feltöltött tartalom (profilkép, portfólió, hirdetés) az adott felhasználó
        tulajdona. Engedélyt adsz a Creatorz.hu-nak az adatok platformon belüli megjelenítésére.
      </p>

      <h2>7. Adatvédelem</h2>
      <p>
        Részletekért lásd az <a href="/adatvedelem" className="underline">Adatvédelmi tájékoztatót</a>.
      </p>

      <h2>8. Felelősség kizárása</h2>
      <p>
        A Creatorz.hu kapcsolatfelvételi platform; a creator és márka közötti együttműködésekért és
        kifizetésekért nem vállal felelősséget.
      </p>

      <h2>9. Megszűnés</h2>
      <p>
        A felhasználó bármikor törölheti a fiókját a Beállítások oldalon. A szolgáltató fenntartja a
        jogot a hozzáférés felfüggesztésére az ÁSZF megsértése esetén.
      </p>

      <h2>10. Vitarendezés</h2>
      <p>A vitás kérdésekre a magyar jog vonatkozik.</p>

      <h2>11. Záró rendelkezések</h2>
      <p>
        A Creatorz.hu fenntartja a jogot az ÁSZF módosítására. A módosítások a közzététellel lépnek
        életbe.
      </p>
    </LegalPage>
  );
}
