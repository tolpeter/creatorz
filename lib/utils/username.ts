import { db } from "@/lib/db";
import { creatorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // ékezetek levétele
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

/**
 * Egyedi username-et ad vissza: ha a kért alap foglalt, szám-suffixet ragaszt hozzá.
 * Üres alap esetén a "creator" alapot használja.
 */
export async function ensureUniqueUsername(base: string): Promise<string> {
  const root = generateUsername(base) || "creator";
  let candidate = root;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: creatorProfiles.id })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.username, candidate))
      .limit(1);

    if (existing.length === 0) return candidate;

    suffix += 1;
    const suffixStr = String(suffix);
    candidate = `${root.substring(0, 50 - suffixStr.length - 1)}-${suffixStr}`;
  }
}
