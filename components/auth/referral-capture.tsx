"use client";

import { useEffect } from "react";

/**
 * Ha a regisztrációs oldalra `?ref=KÓD`-dal érkeznek (meghívó-link), eltároljuk
 * a kódot egy 30 napos cookie-ban. A regisztráció befejezésekor a szerver ebből
 * rögzíti az ajánlást. (window.location → nincs Suspense-igény, a /register
 * statikus maradhat.)
 */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) {
        const clean = encodeURIComponent(ref.trim().slice(0, 16));
        document.cookie = `cz_ref=${clean}; path=/; max-age=2592000; samesite=lax`;
      }
    } catch {
      /* némán */
    }
  }, []);
  return null;
}
