import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role kliens — CSAK szerver oldalon (Server Action / route).
 * Megkerüli az RLS-t, ezért sose kerüljön kliens bundle-be.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Publikus Storage URL-ből kinyeri a bucketen belüli elérési utat. */
export function storagePathFromPublicUrl(
  url: string,
  bucket: string
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
