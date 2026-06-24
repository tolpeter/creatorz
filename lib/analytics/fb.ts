/**
 * Facebook (Meta) Pixel — kliensoldali esemény-küldés.
 * Csak akkor csinál bármit, ha a pixel betöltött (NEXT_PUBLIC_FACEBOOK_PIXEL_ID
 * be van állítva) ÉS a felhasználó hozzájárult a marketing-sütikhez
 * (a hozzájárulást a fbq consent kezeli — lásd lib/analytics/consent.ts).
 */
type FbParams = Record<string, unknown>;

export function fbTrack(event: string, params?: FbParams) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (typeof w.fbq !== "function") return;
  w.fbq("track", event, params ?? {});
}
