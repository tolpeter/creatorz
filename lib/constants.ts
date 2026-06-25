export const APP_NAME = "Creatorz";
export const APP_DOMAIN = "creatorz.hu";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

// Kreatív szakember szerepkörök (csak professional profilnál)
export const PROFESSIONAL_ROLES = [
  { value: "editor", label: "Videóvágó" },
  { value: "photographer", label: "Fotós" },
  { value: "videographer", label: "Operatőr" },
] as const;

// Szolgáltatás-típusok a "tartalomgyártó" (profileKind='ugc') regisztráción belül.
// A márka mást keres és más statot néz típusonként.
export const CREATOR_TYPES = [
  {
    value: "ugc",
    label: "UGC tartalomgyártó",
    tagline: "Tartalmat készítesz a márkának (a márka teszi ki)",
  },
  {
    value: "influencer",
    label: "Influenszer",
    tagline: "A saját csatornádon posztolsz a követőidnek",
  },
  {
    value: "model",
    label: "Modell",
    tagline: "Termék- és divatfotózás, megjelenés-alapú munka",
  },
] as const;

export const CREATOR_TYPE_LABELS: Record<string, string> = {
  ugc: "UGC tartalomgyártó",
  influencer: "Influenszer",
  model: "Modell",
};

// Modell-adatlap opciók
export const HAIR_COLORS = [
  { value: "fekete", label: "Fekete" },
  { value: "barna", label: "Barna" },
  { value: "szoke", label: "Szőke" },
  { value: "voros", label: "Vörös" },
  { value: "osz", label: "Ősz / szürke" },
  { value: "festett", label: "Festett / egyéb" },
] as const;

export const EYE_COLORS = [
  { value: "barna", label: "Barna" },
  { value: "kek", label: "Kék" },
  { value: "zold", label: "Zöld" },
  { value: "szurke", label: "Szürke" },
  { value: "mogyoro", label: "Mogyoró" },
  { value: "egyeb", label: "Egyéb" },
] as const;

export const MODEL_TYPES = [
  { value: "divat", label: "Divat" },
  { value: "fitness", label: "Fitness" },
  { value: "kez-lab", label: "Kéz-láb modell" },
  { value: "plus-size", label: "Plus-size" },
  { value: "glamour", label: "Glamour" },
  { value: "hirdetesi", label: "Hirdetési / kereskedelmi" },
  { value: "szepseg", label: "Szépség" },
  { value: "egyeb", label: "Egyéb" },
] as const;

export const HAIR_COLOR_LABELS: Record<string, string> = Object.fromEntries(
  HAIR_COLORS.map((h) => [h.value, h.label]),
);
export const EYE_COLOR_LABELS: Record<string, string> = Object.fromEntries(
  EYE_COLORS.map((e) => [e.value, e.label]),
);
export const MODEL_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  MODEL_TYPES.map((m) => [m.value, m.label]),
);

// A directory típus-szűrő opciói
export const DIRECTORY_TYPES = [
  { value: "all", label: "Összes alkotó" },
  { value: "ugc", label: "UGC tartalomgyártó" },
  { value: "influencer", label: "Influenszer" },
  { value: "model", label: "Modell" },
  { value: "editor", label: "Videóvágó" },
  { value: "photographer", label: "Fotós" },
  { value: "videographer", label: "Operatőr" },
] as const;

// Szakterület javaslatok (chip-ek, szabadon bővíthető)
export const SPECIALTY_SUGGESTIONS = [
  "Reklámfilm", "Esküvő", "Esemény", "Termékfotó", "Portré",
  "Klip", "Vlog", "Dokumentum", "Social media", "Termékvideó",
  "Ingatlan", "Gasztro", "Divat", "Sport", "Interjú",
] as const;

// Tartalom-bejelentés okai
export const REPORT_REASONS = [
  { value: "spam", label: "Spam vagy megtévesztő" },
  { value: "inappropriate", label: "Nem megfelelő / sértő tartalom" },
  { value: "scam", label: "Csalás gyanúja" },
  { value: "fake", label: "Hamis profil / adatok" },
  { value: "copyright", label: "Szerzői jog megsértése" },
  { value: "other", label: "Egyéb" },
] as const;

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
  { value: "anyukak", label: "Baba-Mama", emoji: "👶" },
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

// Kapcsolat-űrlap előre kiválasztható tárgyai (utolsó: Egyéb → saját tárgy)
export const CONTACT_SUBJECTS = [
  "Általános kérdés",
  "Regisztráció / fiók",
  "Kampány / pályázat",
  "Fizetés / előfizetés",
  "Hibabejelentés",
  "Együttműködési ajánlat",
  "Egyéb",
] as const;

// Együttműködés típusa — a márka állítja be, a creator szűrhet rá
export const COLLABORATION_TYPES = [
  {
    value: "project",
    label: "Projekt alapú",
    description: "Egyszeri megbízás, konkrét feladatra",
  },
  {
    value: "longterm",
    label: "Hosszútávú",
    description: "Folyamatos, visszatérő együttműködés",
  },
  {
    value: "barter",
    label: "Barter",
    description: "Termék vagy szolgáltatás ellenében",
  },
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
  "Marketing & reklám",
  "Médiaügynökség",
  "E-commerce & webshop",
  "Szépségápolás & kozmetika",
  "Divat & ruházat",
  "Ékszer & kiegészítők",
  "Gasztronómia & vendéglátás",
  "Élelmiszer & ital",
  "Egészség & wellness",
  "Fitness & sport",
  "Technológia & szoftver",
  "Mobil & elektronika",
  "Utazás & turizmus",
  "Otthon & lakberendezés",
  "Autó & motor",
  "Pénzügy & biztosítás",
  "Ingatlan",
  "Oktatás & képzés",
  "Szórakoztatás & rendezvény",
  "Gyerek & család",
  "Állatok & kisállat",
  "Játék & hobbi",
  "Nonprofit & civil",
  "Egyéb",
] as const;

export const MAX_PORTFOLIO_ITEMS = 15;
export const MAX_CREATOR_CATEGORIES = 5;
export const BIO_MAX_LENGTH = 500;
