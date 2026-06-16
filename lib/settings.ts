import "server-only";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export const DEFAULT_SETTINGS = {
  creator_subscription_enabled: false,
  creator_subscription_price_huf: 2490,
  feature_7day_price_huf: 3990,
  feature_30day_price_huf: 5990,
  registration_enabled: true,
  auto_approve_creators: false,
  auto_approve_brands: true,
  auto_approve_ads: false,
  analytics_enabled: true,
  // Public-browse kapuk: ha false, csak bejelentkezett user látja a listát.
  public_view_creators: false,
  public_view_ads: false,
  // Mobil-app "hamarosan" popup a főoldalon.
  mobile_app_popup_enabled: false,
  // -----------------------------------------------------------------------
  // Jogi adatkezelő-adatok (admin-ról szerkeszthetők). Élesedéskor cégváltás
  // (magánszemély → EV → KFT) esetén csak ezeket kell módosítani, a jogi
  // oldalak automatikusan átfordulnak.
  // -----------------------------------------------------------------------
  legal_entity_type: "individual" as "individual" | "ev" | "kft",
  legal_name: "Tölgyesi Péter",
  legal_address: "8230 Balatonfüred, Arad utca 22.",
  legal_email: "info@creatorz.hu",
  // Csak EV / KFT esetén töltendő:
  legal_tax_id: "",
  legal_ev_reg_number: "", // egyéni vállalkozói nyilvántartási szám
  legal_kft_court: "", // cégbíróság (pl. Veszprémi Törvényszék Cégbírósága)
  legal_kft_reg_number: "", // cégjegyzékszám (pl. 19-09-XXXXXX)
  legal_naih_id: "", // opcionális NAIH bejelentési szám
} as const;

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
export type LegalEntityType = "individual" | "ev" | "kft";
export type SettingsMap = {
  creator_subscription_enabled: boolean;
  creator_subscription_price_huf: number;
  feature_7day_price_huf: number;
  feature_30day_price_huf: number;
  registration_enabled: boolean;
  auto_approve_creators: boolean;
  auto_approve_brands: boolean;
  auto_approve_ads: boolean;
  analytics_enabled: boolean;
  public_view_creators: boolean;
  public_view_ads: boolean;
  mobile_app_popup_enabled: boolean;
  legal_entity_type: LegalEntityType;
  legal_name: string;
  legal_address: string;
  legal_email: string;
  legal_tax_id: string;
  legal_ev_reg_number: string;
  legal_kft_court: string;
  legal_kft_reg_number: string;
  legal_naih_id: string;
};

/**
 * Összegyűjti a jogi-blokkba illeszthető szövegeket az aktuális
 * settings-alapján. Erre épülnek az /adatvedelem, /aszf, /cookies oldalak
 * adatkezelő-szekciói.
 */
export async function getLegalEntity() {
  const s = await getAllSettings();
  const type = s.legal_entity_type;
  const label =
    type === "kft"
      ? "Korlátolt felelősségű társaság"
      : type === "ev"
        ? "Egyéni vállalkozó"
        : "Magánszemély adatkezelő";
  return {
    type,
    label,
    name: s.legal_name,
    address: s.legal_address,
    email: s.legal_email,
    taxId: s.legal_tax_id,
    evRegNumber: s.legal_ev_reg_number,
    kftCourt: s.legal_kft_court,
    kftRegNumber: s.legal_kft_reg_number,
    naihId: s.legal_naih_id,
  };
}

/** Összes beállítás: DB-érték vagy default. */
export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await db.select().from(settings);
  const map = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const r of rows) {
    if (r.key in DEFAULT_SETTINGS) map[r.key] = r.value;
  }
  return map as SettingsMap;
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsMap[K]> {
  const all = await getAllSettings();
  return all[key];
}
