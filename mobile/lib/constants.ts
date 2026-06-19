// A web kategóriák tükre (a szűrőkhöz). Tartsd szinkronban a webbel.
export const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "gasztro", label: "Gasztro", emoji: "🍳" },
  { value: "utazas", label: "Utazás", emoji: "✈️" },
  { value: "divat", label: "Divat", emoji: "👗" },
  { value: "sport", label: "Sport", emoji: "⚽" },
  { value: "beauty", label: "Beauty", emoji: "💄" },
  { value: "lifestyle", label: "Lifestyle", emoji: "✨" },
  { value: "tech", label: "Tech", emoji: "📱" },
  { value: "otthon", label: "Otthon", emoji: "🏠" },
  { value: "anyukak", label: "Baba-Mama", emoji: "👶" },
  { value: "auto", label: "Autó", emoji: "🚗" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "wellness", label: "Wellness", emoji: "🧘" },
  { value: "vendeglatas", label: "Vendéglátás", emoji: "🍽️" },
  { value: "gyerek", label: "Gyerek", emoji: "🧸" },
  { value: "allatok", label: "Állatok", emoji: "🐾" },
  { value: "egyeb", label: "Egyéb", emoji: "📦" },
];

export const CONTENT_TYPES = [
  { value: "video", label: "Videó" },
  { value: "photo", label: "Fotó" },
  { value: "both", label: "Videó + Fotó" },
];

export const LANGUAGES = [
  { value: "hu", label: "Magyar" }, { value: "en", label: "Angol" },
  { value: "de", label: "Német" }, { value: "ro", label: "Román" },
  { value: "sk", label: "Szlovák" }, { value: "es", label: "Spanyol" },
  { value: "fr", label: "Francia" }, { value: "it", label: "Olasz" },
  { value: "pt", label: "Portugál" }, { value: "nl", label: "Holland" },
  { value: "pl", label: "Lengyel" }, { value: "cs", label: "Cseh" },
  { value: "hr", label: "Horvát" }, { value: "sr", label: "Szerb" },
  { value: "bg", label: "Bolgár" }, { value: "ru", label: "Orosz" },
  { value: "uk", label: "Ukrán" }, { value: "tr", label: "Török" },
  { value: "zh", label: "Kínai" }, { value: "ja", label: "Japán" },
];

export const COUNTIES = [
  "Bács-Kiskun", "Baranya", "Békés", "Borsod-Abaúj-Zemplén", "Budapest",
  "Csongrád-Csanád", "Fejér", "Győr-Moson-Sopron", "Hajdú-Bihar", "Heves",
  "Jász-Nagykun-Szolnok", "Komárom-Esztergom", "Nógrád", "Pest", "Somogy",
  "Szabolcs-Szatmár-Bereg", "Tolna", "Vas", "Veszprém", "Zala",
];

export const GENDERS = [
  { value: "ferfi", label: "Férfi" },
  { value: "no", label: "Nő" },
  { value: "egyeb", label: "Egyéb" },
];
