export const APP_NAME = "Creatorz";
export const APP_DOMAIN = "creatorz.hu";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

// Categories (creator stílusok)
export const CREATOR_CATEGORIES = [
  { value: "gasztro", label: "Gasztro", emoji: "🍳" },
  { value: "utazas", label: "Utazás", emoji: "✈️" },
  { value: "divat", label: "Divat", emoji: "👗" },
  { value: "sport", label: "Sport", emoji: "⚽" },
  { value: "beauty", label: "Beauty", emoji: "💄" },
  { value: "lifestyle", label: "Lifestyle", emoji: "✨" },
  { value: "tech", label: "Tech", emoji: "📱" },
  { value: "otthon", label: "Otthon", emoji: "🏠" },
  { value: "anyukak", label: "Anyukáknak", emoji: "👶" },
  { value: "auto", label: "Autó", emoji: "🚗" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "wellness", label: "Wellness", emoji: "🧘" },
  { value: "vendeglatas", label: "Vendéglátás", emoji: "🍽️" },
  { value: "gyerek", label: "Gyerek", emoji: "🧸" },
  { value: "allatok", label: "Állatok", emoji: "🐾" },
  { value: "egyeb", label: "Egyéb", emoji: "📦" },
] as const;

export const HUNGARIAN_COUNTIES = [
  "Bács-Kiskun", "Baranya", "Békés", "Borsod-Abaúj-Zemplén", "Budapest",
  "Csongrád-Csanád", "Fejér", "Győr-Moson-Sopron", "Hajdú-Bihar", "Heves",
  "Jász-Nagykun-Szolnok", "Komárom-Esztergom", "Nógrád", "Pest", "Somogy",
  "Szabolcs-Szatmár-Bereg", "Tolna", "Vas", "Veszprém", "Zala",
] as const;

export const CONTENT_TYPES = [
  { value: "video", label: "Videó" },
  { value: "photo", label: "Fotó" },
  { value: "both", label: "Videó és fotó" },
] as const;

export const USAGE_RIGHTS = [
  { value: "organic", label: "Organic social media" },
  { value: "paid_ads", label: "Paid ads (fizetett hirdetés)" },
  { value: "perpetual", label: "Perpetual (örökös jog)" },
] as const;

export const LANGUAGES = [
  { value: "hu", label: "Magyar" },
  { value: "en", label: "Angol" },
  { value: "de", label: "Német" },
  { value: "ro", label: "Román" },
  { value: "sk", label: "Szlovák" },
  { value: "es", label: "Spanyol" },
  { value: "fr", label: "Francia" },
  { value: "it", label: "Olasz" },
  { value: "pt", label: "Portugál" },
  { value: "nl", label: "Holland" },
  { value: "pl", label: "Lengyel" },
  { value: "cs", label: "Cseh" },
  { value: "hr", label: "Horvát" },
  { value: "sr", label: "Szerb" },
  { value: "bg", label: "Bolgár" },
  { value: "ru", label: "Orosz" },
  { value: "uk", label: "Ukrán" },
  { value: "tr", label: "Török" },
  { value: "zh", label: "Kínai" },
  { value: "ja", label: "Japán" },
] as const;

export const GENDER_OPTIONS = [
  { value: "ferfi", label: "Férfi" },
  { value: "no", label: "Nő" },
  { value: "egyeb", label: "Egyéb" },
  { value: "nem_mondom", label: "Nem mondom meg" },
] as const;

/**
 * Magasabb szintű niche-csoportok a főoldali böngészőhöz. Mindegyik niche
 * 1+ kategóriához tartozik (`CREATOR_CATEGORIES` value-k).
 */
export const NICHES = [
  { slug: "beauty", label: "Szépségápolás és testápolás", image: "/images/generated/niche-beauty.webp", categories: ["beauty", "wellness"] },
  { slug: "fashion", label: "Ruházat és kiegészítők", image: "/images/generated/niche-fashion.webp", categories: ["divat"] },
  { slug: "food", label: "Étel és ital", image: "/images/generated/niche-food.webp", categories: ["gasztro", "vendeglatas"] },
  { slug: "home", label: "Háztartási termékek", image: "/images/generated/niche-home.webp", categories: ["otthon"] },
  { slug: "health", label: "Egészség", image: "/images/generated/niche-health.webp", categories: ["fitness", "wellness"] },
  { slug: "baby", label: "Baba, gyermek és kismama", image: "/images/generated/niche-baby.webp", categories: ["anyukak", "gyerek"] },
  { slug: "travel", label: "Utazási", image: "/images/generated/niche-travel.webp", categories: ["utazas"] },
  { slug: "pets", label: "Háziállatok", image: "/images/generated/niche-pets.webp", categories: ["allatok"] },
] as const;

export const INDUSTRIES = [
  "Szépségápolás",
  "Divat",
  "Gasztronómia",
  "Egészség & wellness",
  "Technológia",
  "Utazás & turizmus",
  "Otthon & lakberendezés",
  "Sport & fitness",
  "Pénzügy",
  "Oktatás",
  "Szórakoztatás",
  "Egyéb",
] as const;

export const MAX_PORTFOLIO_ITEMS = 15;
export const MAX_CREATOR_CATEGORIES = 3;
export const BIO_MAX_LENGTH = 500;
