/**
 * Social profil-bemenet normalizálása teljes URL-lé.
 *
 * A felhasználó elég, ha csak a felhasználónevet adja meg (pl. `ptrlgys`
 * vagy `@ptrlgys`), a rendszer felépíti a kanonikus URL-t:
 *   tiktok    → https://www.tiktok.com/@ptrlgys
 *   instagram → https://www.instagram.com/ptrlgys
 *   youtube   → https://www.youtube.com/@ptrlgys
 *   facebook  → https://www.facebook.com/ptrlgys
 *
 * Ha már teljes URL-t (http/https vagy domain) adott meg, azt változatlanul
 * hagyjuk (csak a hiányzó https:// előtagot pótoljuk).
 */
export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "youtube";

const BASE: Record<SocialPlatform, string> = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/@",
  facebook: "https://www.facebook.com/",
  youtube: "https://www.youtube.com/@",
};

const DOMAINS: Record<SocialPlatform, string> = {
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  facebook: "facebook.com",
  youtube: "youtube.com",
};

export function normalizeSocialUrl(
  platform: SocialPlatform,
  raw: string | null | undefined,
): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  // Már URL-szerű (tartalmaz pontot vagy protokollt / a platform domainjét).
  const looksLikeUrl =
    /^https?:\/\//i.test(input) || input.includes(DOMAINS[platform]) || input.includes("/");
  if (looksLikeUrl) {
    // Hiányzó protokoll pótlása (pl. "tiktok.com/@x" → "https://tiktok.com/@x").
    return /^https?:\/\//i.test(input) ? input : `https://${input}`;
  }

  // Bare felhasználónév — levesszük a @ és / karaktereket, majd URL-t építünk.
  const handle = input.replace(/^@+/, "").replace(/^\/+|\/+$/g, "");
  if (!handle) return "";
  return `${BASE[platform]}${handle}`;
}
