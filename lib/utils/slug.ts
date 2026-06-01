/** Tiszta (DB-mentes) segédfüggvény — kliens és szerver oldalon is használható. */
export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // ékezetek levétele
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}
