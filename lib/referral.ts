import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, referrals, creatorProfiles } from "@/lib/db/schema";

// Ajánlásonként ennyi nap kiemelést kap a meghívó (creator).
export const REFERRAL_REWARD_DAYS = 7;

function genCode(): string {
  // Félreérthetetlen karakterek (nincs 0/O/1/I).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** A felhasználó egyedi ajánlási kódja (ha nincs, generál egyet). */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [u] = await db
    .select({ code: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (u?.code) return u.code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    try {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      return code;
    } catch {
      // egyediség-ütközés → új kód
    }
  }
  // gyakorlatilag sosem ér ide
  const fallback = `${genCode()}${Math.floor(Math.random() * 90 + 10)}`;
  await db.update(users).set({ referralCode: fallback }).where(eq(users.id, userId));
  return fallback;
}

/**
 * Sikeres ajánlás rögzítése regisztrációkor: a meghívott userhez bejegyezzük a
 * meghívót (egyszer), és a meghívó creator-profilja +REWARD nap kiemelést kap.
 * Visszatérés: true, ha most rögzült új ajánlás.
 */
export async function recordReferral(code: string, referredUserId: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  if (!clean) return false;

  const [ref] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, clean))
    .limit(1);
  if (!ref || ref.id === referredUserId) return false;

  const inserted = await db
    .insert(referrals)
    .values({ referrerUserId: ref.id, referredUserId })
    .onConflictDoNothing({ target: referrals.referredUserId })
    .returning({ id: referrals.id });
  if (!inserted[0]) return false; // ezt a usert már beajánlották

  // Jutalom: a meghívó creator-profiljának +REWARD nap kiemelés (ha van profilja).
  try {
    await db
      .update(creatorProfiles)
      .set({
        isFeatured: true,
        featuredUntil: sql`GREATEST(coalesce(${creatorProfiles.featuredUntil}, now()), now()) + (${REFERRAL_REWARD_DAYS} || ' days')::interval`,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.userId, ref.id));
  } catch {
    // best-effort (ha a meghívó nem creator)
  }
  return true;
}

/** Hány sikeres ajánlása van a felhasználónak. */
export async function referralStats(userId: string): Promise<{ count: number }> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));
  return { count: row?.n ?? 0 };
}
