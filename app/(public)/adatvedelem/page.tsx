import { LegalPage } from "@/components/layout/legal-page";
import { LegalEntityBlock } from "@/components/layout/legal-entity-block";

export const metadata = {
  title: "Adatkezelési tájékoztató",
  description:
    "Hogyan kezeli a Creatorz.hu a személyes adataidat — átláthatóan, GDPR-konformen.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Adatkezelési tájékoztató" updated="2026.06.25.">
      <p className="rounded-lg border border-black/10 bg-[#f6f7f2] p-4 text-sm text-muted-foreground">
        Az alábbi tájékoztató a természetes személyek személyes adatainak kezeléséről
        szóló <strong>(EU) 2016/679 (GDPR)</strong> rendelet, valamint a magyar
        <strong> 2011. évi CXII. törvény (Infotv.)</strong> alapján készült. A
        Creatorz.hu (a továbbiakban: „Szolgáltató") a jelen tájékoztatóval mutatja
        be, hogy milyen adatokat, milyen célból, milyen jogalapon és meddig kezel.
      </p>

      <h2>1. Az Adatkezelő adatai</h2>
      <LegalEntityBlock />
      <p className="text-sm text-muted-foreground">
        <strong>Adatvédelmi tisztviselő (DPO):</strong> nem kötelező (250 fő alatti
        adatkezelő), a fenti email-címen elérhető.
      </p>

      <h2>2. Milyen adatokat kezelünk és miért?</h2>

      <h3>2.1. Regisztráció és fiókkezelés</h3>
      <ul>
        <li><strong>Kötelező:</strong> email cím, jelszó (titkosítottan).</li>
        <li><strong>Cél:</strong> a fiók létrehozása, bejelentkezés, kapcsolattartás.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése (GDPR 6. cikk (1) b)).</li>
        <li><strong>Tárolási idő:</strong> a fiók aktív állapotában, törléstől számított 30 napon belül törlésre kerül (a jogszabályi kötelezettségek kivételével, lásd 5. pont).</li>
      </ul>

      <h3>2.2. Profil-adatok (tartalomgyártó / márka)</h3>
      <ul>
        <li>Megjelenített név, felhasználónév, bio, város, megye, életkor (opcionális),
          nem (opcionális), beszélt nyelvek, kategóriák, kreatív szerepkörök,
          profilkép, intro videó, portfólió-elemek (linkek és feltöltött fájlok),
          közösségi profillinkek (Instagram, TikTok, YouTube, Facebook), valamint
          az ezekhez tartozó nyilvános követőszám.</li>
        <li><strong>Cél:</strong> a profil megjelenítése a kereshető katalógusban, hogy a
          márkák megtalálhassák a tartalomgyártókat.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése + saját hozzájárulásod
          (a profil minden mezője szerkeszthető és törölhető).</li>
        <li><strong>Tárolási idő:</strong> a fiók fennállásáig, ill. amíg a profilt
          láthatóvá teszed.</li>
      </ul>

      <h3>2.3. Márka-profil (cég) adatok</h3>
      <ul>
        <li>Cégnév, weboldal, iparág, székhely, adószám (számlázáshoz), kapcsolattartó.</li>
        <li><strong>Cél:</strong> kampányfeladás, számla kiállítása, beazonosítás.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése + jogszabályi kötelezettség
          (számviteli törvény, Áfa-törvény).</li>
        <li><strong>Tárolási idő:</strong> a számlázott tételekhez kapcsolódó adatok a
          jogszabály szerint <strong>8 évig</strong> megőrződnek.</li>
      </ul>

      <h3>2.4. Fizetési adatok</h3>
      <ul>
        <li>A bankkártya-adatokat <strong>NEM</strong> mi tároljuk — a fizetést a
          <strong> Stripe Payments Europe Ltd.</strong> (Írország) dolgozza fel
          PCI-DSS Level 1 tanúsítással. Mi csak a Stripe customer ID-t, az
          előfizetés státuszát és a számlatételeket tároljuk.</li>
        <li><strong>Cél:</strong> előfizetés és kiemelés vásárlás kezelése, számlázás.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése + jogszabályi kötelezettség.</li>
      </ul>

      <h3>2.5. Üzenetek, pályázatok, értékelések</h3>
      <ul>
        <li>A platformon belül küldött üzenetek, pályázati szövegek és a lezárt
          együttműködésekhez írt értékelések.</li>
        <li><strong>Cél:</strong> a felek közti kommunikáció és visszajelzés-kezelés.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése.</li>
        <li><strong>Tárolási idő:</strong> a fiók fennállásáig (értékelések törölhetők,
          de a felek beazonosítása érdekében hosszabb ideig megmaradhatnak).</li>
      </ul>

      <h3>2.6. Naplófájlok és műszaki adatok</h3>
      <ul>
        <li>IP-cím (anonimizálva), böngésző típus, oldalmegtekintések, hibák.</li>
        <li><strong>Cél:</strong> biztonság, visszaélések megelőzése, hibák felderítése,
          szolgáltatás-fejlesztés.</li>
        <li><strong>Jogalap:</strong> jogos érdek (GDPR 6. cikk (1) f)).</li>
        <li><strong>Tárolási idő:</strong> 12 hónap, utána automatikus törlés.</li>
      </ul>

      <h3>2.7. Sütik (cookies)</h3>
      <p>
        Részletek a <a href="/cookies" className="underline">Cookie szabályzatban</a>.
        A statisztikai és marketing sütiket csak hozzájárulásod után aktiváljuk
        (Consent Mode v2).
      </p>

      <h3>2.8. Hirdetés-konverziók mérése (Meta Pixel)</h3>
      <ul>
        <li>Ha Facebook- vagy Instagram-hirdetésen keresztül érkezel, a <strong>Meta
          (Facebook) Pixel</strong> segítségével mérjük a hirdetések eredményességét,
          pl. a sikeres regisztrációt (konverzió). Ehhez a Meta sütiket helyezhet el
          és technikai azonosítókat (pl. eszköz-/böngészőadat, IP-cím) dolgozhat fel.</li>
        <li><strong>Cél:</strong> a hirdetési kampányok hatékonyságának mérése és
          optimalizálása.</li>
        <li><strong>Jogalap:</strong> a <strong>hozzájárulásod</strong> (GDPR 6. cikk
          (1) a)). A Pixel <strong>csak akkor</strong> aktiválódik, ha a cookie-bannerben
          elfogadod a marketing-sütiket; a hozzájárulás bármikor visszavonható a
          cookie-beállításokban.</li>
        <li><strong>Megjegyzés:</strong> a Meta a saját rendszerében önálló
          adatkezelőként is felhasználhatja az adatokat — erről a Meta saját
          adatkezelési tájékoztatója rendelkezik.</li>
      </ul>

      <h2>3. Adatfeldolgozók (akiknek továbbítjuk az adatokat)</h2>
      <p>A szolgáltatás működéséhez az alábbi adatfeldolgozókat vesszük igénybe:</p>
      <ul>
        <li><strong>Supabase Inc.</strong> (USA — EU-régió) — adatbázis és authentikáció. SCC-vel és DPA-val.</li>
        <li><strong>Vercel Inc.</strong> (USA) — hosting és CDN. SCC-vel és DPA-val.</li>
        <li><strong>Stripe Payments Europe Ltd.</strong> (Írország) — fizetésfeldolgozás.</li>
        <li><strong>Resend Inc.</strong> (USA) — tranzakciós emailek küldése.</li>
        <li><strong>Google LLC</strong> (Google Analytics 4) — látogatottság-mérés (csak hozzájárulással, anonimizált IP-vel).</li>
        <li><strong>Meta Platforms Ireland Ltd.</strong> (Írország) — Facebook/Instagram hirdetés-konverziók mérése (Meta Pixel), csak marketing-hozzájárulás esetén.</li>
        <li><strong>Replicate</strong> / <strong>OpenAI</strong> — opcionális AI-funkciók (avatar generálás, követőszám-becslés). A személyazonosító adatokat nem küldjük át.</li>
      </ul>
      <p>
        Az EU-n kívülre továbbított adatokra a GDPR 46. cikk szerinti
        <strong> Standard Contractual Clauses (SCC)</strong> biztosítják a megfelelő szintű védelmet.
      </p>

      <h2>4. Automatizált döntéshozatal</h2>
      <p>
        Profilalkotást és automatizált döntéshozatalt <strong>nem végzünk</strong> a
        GDPR 22. cikke szerinti, jogi hatást kiváltó értelemben. A rangsorolás
        algoritmus alapú, de nem hoz egyedi jogi következménnyel járó döntést.
      </p>

      <h2>5. Tárolási idő</h2>
      <ul>
        <li><strong>Fiók-adatok:</strong> az aktív állapotig, a törlés bejelentésétől számított 30 napon belül törlésre kerülnek.</li>
        <li><strong>Számlázási adatok:</strong> a számvitelről szóló 2000. évi C. tv. alapján <strong>8 év</strong>.</li>
        <li><strong>Naplófájlok:</strong> 12 hónap.</li>
        <li><strong>Hírlevél-feliratkozás:</strong> a leiratkozásig.</li>
      </ul>

      <h2>6. A te jogaid (GDPR III. fejezet)</h2>
      <ul>
        <li><strong>Hozzáférés joga (15. cikk)</strong> — bármikor kérhetsz másolatot a rólad tárolt adatokról.</li>
        <li><strong>Helyesbítés (16. cikk)</strong> — a profilodon közvetlenül módosíthatod.</li>
        <li><strong>Törlés / „elfeledtetés" (17. cikk)</strong> — a Beállítások / Fiók törlése gomb, vagy email-kérelem.</li>
        <li><strong>Korlátozás (18. cikk)</strong>.</li>
        <li><strong>Adathordozhatóság (20. cikk)</strong> — kérésre strukturált, gépi olvasható (JSON / CSV) formátumban átadjuk.</li>
        <li><strong>Tiltakozás (21. cikk)</strong> — a jogos érdeken alapuló adatkezelés ellen.</li>
        <li><strong>Hozzájárulás visszavonása</strong> — bármikor.</li>
      </ul>
      <p>
        A kéréseket az <strong>info@creatorz.hu</strong> címen várjuk, és legfeljebb
        <strong> 30 napon belül</strong> válaszolunk (a GDPR 12. cikk (3) szerint).
      </p>

      <h2>7. Panasz benyújtása</h2>
      <p>
        Ha úgy érzed, az adatkezelésünk jogsértő, panasszal élhetsz a felügyeleti
        hatóságnál:
      </p>
      <ul>
        <li><strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong></li>
        <li>Cím: 1055 Budapest, Falk Miksa utca 9-11.</li>
        <li>Telefon: +36 (1) 391-1400</li>
        <li>Email: ugyfelszolgalat@naih.hu</li>
        <li>Web: <a href="https://www.naih.hu" target="_blank" rel="noopener noreferrer" className="underline">naih.hu</a></li>
      </ul>
      <p>
        Polgári bírósághoz is fordulhatsz — lakóhelyed szerinti törvényszék az illetékes.
      </p>

      <h2>8. Adatbiztonság</h2>
      <p>
        Az adatok tárolása EU-régiós, titkosított Supabase Postgres-ben történik.
        A jelszavak bcrypt-tel sózottan tároltak. A platformot TLS 1.2+ védi. A
        Stripe és Resend ISO 27001 / PCI-DSS / SOC 2 megfeleltek.
      </p>

      <h2>9. Kiskorúak</h2>
      <p>
        A szolgáltatást <strong>16 éven aluli</strong> személyek nem használhatják.
        A regisztrációval kijelented, hogy elmúltál 16 éves.
      </p>

      <h2>10. A tájékoztató módosítása</h2>
      <p>
        Fenntartjuk a jogot, hogy a tájékoztatót — pl. új funkció vagy jogszabály-változás miatt — módosítsuk.
        Lényeges változásról email-ben értesítünk, és az új verzió közzétételével egyidejűleg lép hatályba.
      </p>
    </LegalPage>
  );
}
