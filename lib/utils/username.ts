import { db } from "@/lib/db";
import { creatorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateUsername } from "@/lib/utils/slug";

export { generateUsername };

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
