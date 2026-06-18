import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type MobileUser = typeof users.$inferSelect;

/**
 * A mobil app Bearer JWT-jéből feloldja a bejelentkezett `users` sort.
 * A tokent a Supabase admin klienssel ellenőrizzük. null, ha érvénytelen.
 */
export async function getMobileUser(req: Request): Promise<MobileUser | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.authId, data.user.id))
      .limit(1);
    return u ?? null;
  } catch {
    return null;
  }
}
