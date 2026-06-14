"use client";

import { useEffect } from "react";
import { readConsent, applyConsent } from "@/lib/analytics/consent";

/**
 * Visszatérő látogatónál betöltéskor érvényesíti a korábban mentett
 * cookie-választást a Google Consent Mode felé (denied → granted, ha kellett).
 */
export function ConsentInit() {
  useEffect(() => {
    const consent = readConsent();
    if (consent) applyConsent(consent);
  }, []);
  return null;
}
