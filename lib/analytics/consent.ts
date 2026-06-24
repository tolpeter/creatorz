/**
 * Cookie-hozzájárulás kezelése — Google Consent Mode v2 kompatibilis.
 *
 * A választást egy 1 évig élő cookie-ban tároljuk (NEM localStorage — a projekt
 * szabálya szerint böngésző-storage helyett mindig cookie/Supabase session).
 *
 * Kategóriák:
 *  - necessary  → mindig aktív (bejelentkezés, biztonság). Nem kapcsolható ki.
 *  - analytics  → Google Analytics (látogatottság mérése, anonimizálva).
 *  - marketing  → hirdetés-személyre szabás (jelenleg nincs aktív hirdetés).
 */

export type ConsentCategories = {
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentCategories & {
  necessary: true;
  v: number;
  ts: number;
};

export const CONSENT_COOKIE = "creatorz_cookie_consent";
const CONSENT_VERSION = 2;
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Kiolvassa a tárolt hozzájárulást a cookie-ból (régi "accepted"/"rejected" formátumot is kezeli). */
export function readConsent(): ConsentCategories | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]+)`),
  );
  if (!match) return null;
  const raw = decodeURIComponent(match[1]);
  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed && typeof parsed === "object") {
      return {
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      };
    }
  } catch {
    // Visszafelé kompatibilitás a régi banner egyszerű értékeivel.
    if (raw === "accepted") return { analytics: true, marketing: true };
    if (raw === "rejected") return { analytics: false, marketing: false };
  }
  return null;
}

/** Elmenti a választást cookie-ba és azonnal érvényesíti a Google Consent Mode felé. */
export function writeConsent(c: ConsentCategories) {
  if (typeof document === "undefined") return;
  const value: StoredConsent = {
    ...c,
    necessary: true,
    v: CONSENT_VERSION,
    ts: Date.now(),
  };
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(value),
  )}; max-age=${ONE_YEAR}; path=/; samesite=lax`;
  applyConsent(c);
}

/** A választást átküldi a Google Consent Mode-nak és a Meta Pixelnek. */
export function applyConsent(c: ConsentCategories) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
    });
  }
  // Meta (Facebook) Pixel — a marketing-hozzájáruláshoz kötve. Csak ezután mér.
  if (typeof w.fbq === "function") {
    if (c.marketing) {
      w.fbq("consent", "grant");
      w.fbq("track", "PageView");
    } else {
      w.fbq("consent", "revoke");
    }
  }
}

/** Esemény, amivel bárhonnan újra megnyitható a cookie-beállítások panel. */
export const OPEN_COOKIE_SETTINGS_EVENT = "creatorz:open-cookie-settings";

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  }
}
