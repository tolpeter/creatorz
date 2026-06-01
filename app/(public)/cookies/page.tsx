import { LegalPage } from "@/components/layout/legal-page";

export const metadata = { title: "Cookie szabályzat" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie szabályzat" updated="2026.06.01.">
      <h2>Mi a süti?</h2>
      <p>
        A süti (cookie) egy kis adatfájl, amit a böngésződ tárol. Segítségükkel az oldal felismer
        és személyre tudja szabni az élményt.
      </p>

      <h2>Milyen sütiket használunk?</h2>
      <ul>
        <li>
          <strong>Szükséges sütik (mindig aktívak):</strong> bejelentkezési munkamenet (Supabase
          Auth), CSRF védelem.
        </li>
        <li>
          <strong>Beállítás:</strong> a cookie beleegyezésed (creatorz_cookie_consent).
        </li>
        <li>
          <strong>Statisztika:</strong> jelenleg nem használunk harmadik féltől származó analitikát.
          Élesítés után esetlegesen privacy-friendly analytics (pl. Plausible) — ehhez külön
          beleegyezést kérünk.
        </li>
      </ul>

      <h2>Beleegyezés visszavonása</h2>
      <p>
        Töröld a böngésződ Creatorz.hu sütijeit, és a banner újra megjelenik a következő látogatáskor.
      </p>
    </LegalPage>
  );
}
