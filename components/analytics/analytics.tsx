import Script from "next/script";
import { ConsentInit } from "./consent-init";
import { getSetting } from "@/lib/settings";

/**
 * Google Analytics 4 + Google Tag Manager betöltése Consent Mode v2-vel.
 *
 * Konfiguráció a környezeti változókkal (egyik vagy mindkettő megadható):
 *   NEXT_PUBLIC_GA_ID   = "G-XXXXXXXXXX"   (közvetlen GA4 mérési azonosító)
 *   NEXT_PUBLIC_GTM_ID  = "GTM-XXXXXXX"    (Tag Manager konténer azonosító)
 *
 * Ha egyik sincs megadva, semmi nem töltődik be (fejlesztés közben kikapcsolva marad).
 *
 * Adatvédelem: induláskor minden statisztikai/marketing tárolás "denied"
 * (Consent Mode default). Csak a felhasználó kifejezett beleegyezése után
 * (cookie banner) válik "granted"-dá — ekkor kezd a GA sütiket írni.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export async function Analytics() {
  if (!GA_ID && !GTM_ID) return null;

  // Admin kapcsoló: a felületről kód nélkül kikapcsolható a mérés.
  // DB-hiba esetén bekapcsolva marad (a konfigurált ID a fő kapcsoló).
  let enabled = true;
  try {
    enabled = await getSetting("analytics_enabled");
  } catch {
    enabled = true;
  }
  if (!enabled) return null;

  return (
    <>
      {/* 1) Consent Mode v2 alapállapot — MINDIG a GA/GTM betöltése ELŐTT fut. */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent','default',{
            ad_storage:'denied',
            ad_user_data:'denied',
            ad_personalization:'denied',
            analytics_storage:'denied',
            functionality_storage:'granted',
            security_storage:'granted',
            wait_for_update:500
          });
          gtag('set','ads_data_redaction',true);
          gtag('set','url_passthrough',true);
        `}
      </Script>

      {/* 2) Google Tag Manager konténer (ha be van állítva) */}
      {GTM_ID && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {/* 3) Közvetlen GA4 (ha be van állítva) */}
      {GA_ID && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* 4) Visszatérő látogató korábbi választásának érvényesítése */}
      <ConsentInit />

      {/* GTM noscript fallback (JS nélküli böngészőkhöz) */}
      {GTM_ID && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>
      )}
    </>
  );
}
