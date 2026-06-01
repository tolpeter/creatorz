import { LegalPage } from "@/components/layout/legal-page";

export const metadata = { title: "Adatvédelmi tájékoztató" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Adatvédelmi tájékoztató" updated="2026.06.01.">
      <p className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-900 dark:text-yellow-200">
        ⚠️ Sablonszöveg — élesítés előtt töltsd ki a cégadatokkal és pontosítsd ügyvéddel.
      </p>

      <h2>1. Adatkezelő</h2>
      <p>Creatorz.hu — kapcsolat: info@creatorz.hu</p>

      <h2>2. Kezelt adatok</h2>
      <ul>
        <li>Email cím (regisztráció)</li>
        <li>Profil adatok (név, bio, lokáció, kor, nem — opcionális)</li>
        <li>Feltöltött képek és videók</li>
        <li>Közösségi platform linkek és követőszám</li>
        <li>Fizetési azonosítók (Stripe customer ID — nem mi tároljuk a kártyaadatokat!)</li>
      </ul>

      <h2>3. Adatkezelés jogalapja</h2>
      <p>
        Szerződéses kötelezettség teljesítése (regisztráció, szolgáltatásnyújtás), jogos érdek
        (biztonság, csalásmegelőzés), hozzájárulás (marketing emailek).
      </p>

      <h2>4. Adatok továbbítása</h2>
      <ul>
        <li><strong>Supabase</strong> — adatbázis és authentikáció (EU régió)</li>
        <li><strong>Stripe</strong> — fizetés feldolgozás</li>
        <li><strong>Resend</strong> — emailek küldése</li>
        <li><strong>Vercel</strong> — hosting</li>
        <li><strong>Replicate</strong> — kép generálás (opcionális)</li>
      </ul>

      <h2>5. Tárolási idő</h2>
      <p>A fiók aktív állapotában tárolva. Fiók törlése után 30 napon belül hard delete.</p>

      <h2>6. Felhasználói jogok (GDPR)</h2>
      <ul>
        <li>Hozzáférési jog (adataidat lekérheted)</li>
        <li>Helyesbítés (módosítás a profil oldalon)</li>
        <li>Törlés (fiók törlése a Beállításoknál)</li>
        <li>Adathordozhatóság (export kérése)</li>
        <li>Panasz a NAIH-hoz: <a href="https://naih.hu" className="underline" target="_blank" rel="noopener noreferrer">naih.hu</a></li>
      </ul>

      <h2>7. Cookie használat</h2>
      <p>
        Részletek a <a href="/cookies" className="underline">Cookie szabályzatban</a>.
      </p>

      <h2>8. Kapcsolat</h2>
      <p>info@creatorz.hu</p>
    </LegalPage>
  );
}
