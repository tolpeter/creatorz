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
] as const;
