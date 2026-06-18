import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  // Fejlesztői figyelmeztetés — a .env-ben be kell állítani.
  console.warn("[supabase] Hiányzó EXPO_PUBLIC_SUPABASE_URL / ANON_KEY a .env-ben.");
}

/**
 * Supabase kliens a mobil apphoz. A sessiont AsyncStorage-ben tartja
 * (a bejelentkezés a következő indításnál is megmarad).
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
