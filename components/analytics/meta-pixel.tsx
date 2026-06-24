import Script from "next/script";

/**
 * Facebook (Meta) Pixel — konverziómérés (pl. regisztráció) FB/Instagram
 * hirdetésekhez. Beállítás:
 *   NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "1234567890"   (a Meta Events Manager-ből)
 * Ha nincs megadva, semmi nem töltődik be.
 *
 * Adatvédelem: induláskor a pixel hozzájárulása "revoke" (nem mér, nem ír sütit).
 * Csak akkor kezd mérni, ha a felhasználó a cookie-bannerben elfogadja a
 * marketing-sütiket — ezt a fbq consent kezeli (lib/analytics/consent.ts).
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export function MetaPixel() {
  if (!PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('consent','revoke');
          fbq('init','${PIXEL_ID}');
          fbq('track','PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
