import { LegalPage } from "@/components/layout/legal-page";
import { LegalEntityBlock } from "@/components/layout/legal-entity-block";
import { getLegalEntity } from "@/lib/settings";

export const metadata = {
  title: "Általános Szerződési Feltételek",
  description: "A Creatorz.hu szolgáltatás használatának feltételei.",
};

export default async function TermsPage() {
  const entity = await getLegalEntity();
  // Magánszemély üzemeltetőnél ez NEM klasszikus ÁSZF, csak felhasználási feltétel
  // (mert nincs fizetős szerződéses szolgáltatás). Élesedéskor (EV/KFT) átáll.
  const title =
    entity.type === "individual"
      ? "Felhasználási feltételek"
      : "Általános Szerződési Feltételek";
  const shortName = entity.type === "individual" ? "Feltételek" : "ÁSZF";

  return (
    <LegalPage title={title} updated="2026.06.14.">
      <p className="rounded-lg border border-black/10 bg-[#f6f7f2] p-4 text-sm text-muted-foreground">
        A jelen {title} (a továbbiakban: „{shortName}") a Creatorz.hu szolgáltatás
        (a továbbiakban: „Szolgáltatás") használatának feltételeit szabályozzák.
        A Szolgáltatás használatával — különösen a regisztrációval — kifejezetten
        elfogadod a jelen {shortName}-et.
      </p>

      <h2>1. A Szolgáltató</h2>
      <LegalEntityBlock />

      <h2>2. A Szolgáltatás leírása</h2>
      <p>
        A Creatorz.hu egy magyar nyelvű, online platform, amely UGC tartalomgyártókat,
        kreatív szakembereket (videós, fotós, operatőr) és márkákat köt össze.
        A Szolgáltató saját nevében nem köt szerződést a Felhasználók között
        létrejövő együttműködésekre — a platform kizárólag a kapcsolatfelvételt
        és a kommunikációt biztosítja.
      </p>

      <h2>3. Fogalmak</h2>
      <ul>
        <li><strong>Felhasználó:</strong> minden, a Szolgáltatást regisztrált vagy nem regisztrált módon használó természetes vagy jogi személy.</li>
        <li><strong>Tartalomgyártó (Creator):</strong> az a Felhasználó, aki a profilját és portfólióját meghirdeti, és márka-projektekre pályázik.</li>
        <li><strong>Márka:</strong> az a Felhasználó (cég vagy egyéni vállalkozó), aki hirdetést ad fel és tartalomgyártót keres.</li>
        <li><strong>Hirdetés:</strong> a márka által közzétett, együttműködésre szóló felhívás.</li>
        <li><strong>Pályázat:</strong> a tartalomgyártó által egy hirdetésre küldött jelentkezés.</li>
        <li><strong>Együttműködés:</strong> az elfogadott pályázat alapján létrejövő munkakapcsolat.</li>
        <li><strong>Kiemelt profil:</strong> a Szolgáltató rendszerében előfizetéssel vagy egyszeri vásárlással szerzett, magasabb láthatóságot biztosító funkció.</li>
      </ul>

      <h2>4. Regisztráció</h2>
      <ul>
        <li>A regisztráció ingyenes, és csak <strong>betöltött 16. életév</strong> felett lehetséges.</li>
        <li>A Felhasználó köteles valós adatokat megadni, és köteles azok naprakészségét fenntartani.</li>
        <li>Egy természetes személy egy aktív fiókkal rendelkezhet (kivéve ha külön márka-fiókot is regisztrál).</li>
        <li>A Felhasználó köteles a jelszavát biztonságosan kezelni — a fiókja használatáért felelősséggel tartozik.</li>
      </ul>

      <h2>5. Szolgáltatási csomagok és díjak</h2>
      <p>Az aktuális díjszabást a Szolgáltató fenntartja a jogot egyoldalúan módosítani — a változás csak a jövőre nézve hatályos.</p>
      <h3>5.1. Tartalomgyártóknak</h3>
      <ul>
        <li><strong>Alap regisztráció:</strong> ingyenes — profil létrehozása, pályázat hirdetésekre.</li>
        <li><strong>Prémium előfizetés:</strong> jelenleg <strong>2 990 Ft / hó</strong>, havi automatikus megújulással. A jelenleg érvényes ár az adminisztrációs felületen kerül beállításra; ha módosul, az új ár csak az új előfizetésekre vagy a következő megújulási ciklusra vonatkozik.</li>
        <li><strong>Profil-kiemelés:</strong> 7 napra 4 990 Ft, 30 napra 12 990 Ft — egyszeri díj, automatikusan nem újul meg.</li>
      </ul>
      <h3>5.2. Márkáknak</h3>
      <ul>
        <li><strong>Regisztráció:</strong> ingyenes.</li>
        <li><strong>Hirdetésfeladás:</strong> ingyenes.</li>
        <li><strong>Hirdetés-kiemelés:</strong> az aktuális díjszabás szerint.</li>
        <li><strong>Anonim hirdetés:</strong> külön opció, amellyel a márka adatai csak az elfogadott pályázat után válnak láthatóvá a tartalomgyártó számára.</li>
      </ul>
      <h3>5.3. Fizetés</h3>
      <p>
        A fizetést a Stripe Payments Europe Ltd. dolgozza fel HUF pénznemben. A
        Szolgáltató magyar nyelvű számlát állít ki, amely a Felhasználó
        fiókjából letölthető.
      </p>

      <h2>6. Elállási és felmondási jog</h2>
      <ul>
        <li><strong>Előfizetés:</strong> bármikor felmondhatod a Beállítások &gt; Előfizetés menüben. A felmondás a folyó számlázási időszak végén lép hatályba; visszatérítés nem jár.</li>
        <li><strong>Profil-kiemelés:</strong> egyszeri vásárlás után — mivel a digitális szolgáltatás a kifizetést követően azonnal teljesül — a 45/2014. (II. 26.) Korm. rendelet 29. § (1) m) pontja alapján <strong>nem illet meg az elállási jog</strong>.</li>
        <li><strong>Fogyasztói elállás (alap eset):</strong> 14 napon belüli elállási jogot biztosítunk minden olyan szolgáltatásra, amelynek teljesítése még nem kezdődött meg. A kifejezett hozzájárulásoddal a teljesítés megkezdődhet a 14 napon belül is — ezzel az elállási jogod megszűnik.</li>
      </ul>

      <h2>7. Felhasználói tartalom és szerzői jog</h2>
      <ul>
        <li>A Felhasználó által feltöltött tartalom (profilkép, portfólió-elem, intro videó, hirdetés szövege, stb.) a Felhasználó tulajdona, illetve a Felhasználó által jogszerűen használt mű.</li>
        <li>A Felhasználó nem kizárólagos, díjmentes felhasználási engedélyt biztosít a Szolgáltatónak arra, hogy ezeket a tartalmakat a platform működéséhez szükséges mértékben megjelenítse, terjessze és technikailag feldolgozza.</li>
        <li>A Felhasználó szavatol azért, hogy a feltöltött tartalom nem sérti harmadik személyek jogait (szerzői jog, képmás védelem, márkajog, személyiségi jog).</li>
        <li>Tilos: jogsértő, gyűlöletkeltő, pornográf, megtévesztő, spam jellegű, kiskorúak érdekét sértő, vagy hatóság által tiltott tartalom.</li>
      </ul>

      <h2>8. Felhasználói kötelezettségek</h2>
      <ul>
        <li>A platformot kizárólag a célnak megfelelően, jóhiszeműen használhatod.</li>
        <li>Tilos: automatizált scraping, bot-tevékenység, más felhasználók zaklatása, hamis profil, valótlan követőszám közlése, megtévesztő pályázat.</li>
        <li>A platformon belüli kommunikációt nem lehet megkerülni a fizetés platformon kívülre terelése céljából, amíg az együttműködés a platformon belül indult el.</li>
      </ul>

      <h2>9. Anonim hirdetések és pályázat-folyamat</h2>
      <ul>
        <li>A márka jelölheti hirdetését „anonim"-ként — ekkor a brand nyilvános adatai (cégnév, logo, weboldal) csak elfogadott pályázat után válnak láthatóvá a tartalomgyártó számára.</li>
        <li>Az anonim hirdetésnél is köteles a márka a Szolgáltató felé minden, az ÁSZF szerinti adatot megadni.</li>
        <li>Értékelést (review) csak a lezárt együttműködés után, mindkét fél a másikról írhat.</li>
      </ul>

      <h2>10. Felelősség kizárása</h2>
      <ul>
        <li>A Szolgáltató kapcsolatfelvételi platform — a Felhasználók közti pénzügyi és tartalmi teljesítésért nem vállal felelősséget.</li>
        <li>A Szolgáltatás „as is" alapon vehető igénybe. Folyamatos, hibamentes működést a Szolgáltató nem garantál; tervezett karbantartásokról értesít.</li>
        <li>A Szolgáltató nem felel olyan kárért, amely a Szolgáltató ellenőrzési körén kívül eső eseményből származik (vis maior, infrastruktúra-szolgáltatók — Vercel, Supabase, Stripe — leállása).</li>
      </ul>

      <h2>11. Adatvédelem</h2>
      <p>
        A személyes adatok kezelését részletesen az <a href="/adatvedelem" className="underline">Adatkezelési tájékoztató</a> szabályozza.
      </p>

      <h2>12. Felfüggesztés és megszüntetés</h2>
      <ul>
        <li>A Szolgáltató jogosult a fiókot felfüggeszteni vagy törölni, ha a Felhasználó megsérti a jelen ÁSZF-et, illetve ha visszaélés, csalás, vagy jogsértés gyanúja merül fel.</li>
        <li>A Felhasználó bármikor törölheti a fiókját — ennek menete a Beállítások &gt; Fiók törlése pontban érhető el.</li>
        <li>Felmondás esetén a már kifizetett, fel nem használt szolgáltatás díja nem jár vissza, kivéve, ha a Szolgáltató súlyos szerződésszegése áll fenn.</li>
      </ul>

      <h2>13. Panaszkezelés és vitarendezés</h2>
      <p>
        Panasszal az <strong>info@creatorz.hu</strong> címen élhetsz. Igyekszünk 30 napon belül érdemben válaszolni.
      </p>
      <p>
        Fogyasztói jogvita esetén a békéltető testülethez fordulhatsz — például:
      </p>
      <ul>
        <li>Budapesti Békéltető Testület — 1016 Budapest, Krisztina krt. 99., bekelteto.testulet@bkik.hu</li>
        <li>Európai Bizottság online vitarendezési platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline">ec.europa.eu/consumers/odr</a></li>
      </ul>

      <h2>14. Alkalmazandó jog és illetékesség</h2>
      <p>
        A jelen ÁSZF-re Magyarország joga az irányadó. A vitás kérdésekben a magyar rendes bíróságok rendelkeznek joghatósággal.
      </p>

      <h2>15. Az ÁSZF módosítása</h2>
      <p>
        A Szolgáltató fenntartja a jogot a jelen ÁSZF egyoldalú módosítására,
        amelyről a Felhasználókat előzetesen, legalább <strong>15 nappal a hatálybalépés előtt</strong>,
        email-ben vagy az oldalon történő közzététellel értesíti. Ha nem fogadod
        el az új ÁSZF-et, a hatálybalépés előtt felmondhatod a szolgáltatást.
      </p>
    </LegalPage>
  );
}
