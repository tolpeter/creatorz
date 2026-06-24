import { LegalPage } from "@/components/layout/legal-page";
import { CookieSettingsButton } from "@/components/shared/cookie-settings-button";

export const metadata = { title: "Cookie szabályzat" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie szabályzat" updated="2026.06.25.">
      <h2>Mi a süti?</h2>
      <p>
        A süti (cookie) egy kis adatfájl, amit a böngésződ tárol. Segítségükkel
        az oldal felismer, biztonságosan bejelentkezve tart, és — engedélyeddel —
        méri a látogatottságot.
      </p>

      <h2>Hozzájárulás (Consent Mode)</h2>
      <p>
        Az oldal a Google Consent Mode v2 szerint működik: alapértelmezetten
        minden statisztikai és marketing süti <strong>tiltott</strong>, és csak
        akkor lép működésbe, ha a sütibanneren kifejezetten engedélyezed. A
        szükséges sütik ehhez nem kötöttek, mert nélkülük az oldal nem működne.
      </p>

      <h2>Milyen sütiket használunk?</h2>
      <ul>
        <li>
          <strong>Szükséges sütik (mindig aktívak):</strong> bejelentkezési
          munkamenet (Supabase Auth), CSRF/biztonsági védelem, valamint a
          cookie-választásod tárolása (<code>creatorz_cookie_consent</code>).
        </li>
        <li>
          <strong>Statisztikai sütik (engedélyhez kötött):</strong> Google
          Analytics 4 — névtelen, anonimizált IP-vel mért látogatottság (pl.
          oldalmegtekintések, eszköztípus, forgalmi források). Ezek segítenek
          fejleszteni az oldalt. A Google ehhez <code>_ga</code> kezdetű sütiket
          használhat, miután hozzájárultál.
        </li>
        <li>
          <strong>Marketing sütik (engedélyhez kötött):</strong> hirdetés-konverziók
          mérése és optimalizálása. Ehhez a <strong>Meta (Facebook) Pixel</strong>t
          használjuk, amely a Facebook/Instagram hirdetésekből érkező látogatók
          eredményeit (pl. sikeres regisztráció) méri, és ehhez a Meta
          <code>_fbp</code> kezdetű sütit helyezhet el. Ezek a sütik
          <strong>alapból kikapcsoltak</strong>, és csak akkor lépnek működésbe, ha
          a marketing-sütiket kifejezetten engedélyezed.
        </li>
      </ul>

      <h2>Mennyi ideig tároljuk?</h2>
      <p>
        A cookie-választásod 1 évig él, utána újra megkérdezünk. A Google
        Analytics sütik élettartama jellemzően a Google beállításaitól függ
        (általában néhány hónaptól 2 évig).
      </p>

      <h2>Beállítások módosítása vagy visszavonása</h2>
      <p>
        A döntésed bármikor megváltoztathatod a lenti gombbal, vagy a lábléc
        „Cookie beállítások” pontjával. A böngésződ Creatorz-sütijeit törölve a
        banner is újra megjelenik a következő látogatáskor.
      </p>
      <p>
        <CookieSettingsButton className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-bold text-black no-underline transition-colors hover:bg-accent/90" />
      </p>
    </LegalPage>
  );
}
