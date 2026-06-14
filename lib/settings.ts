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
} as const;

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
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
};

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
