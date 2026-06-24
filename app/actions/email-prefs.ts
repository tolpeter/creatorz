"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { EmailPrefs } from "@/lib/email/prefs";

/** A bejelentkezett felhasználó email-beállításai (null/hiányzó mező = bekapcsolva). */
export async function getMyEmailPrefs(): Promise<EmailPrefs> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return {};
  try {
    const [row] = await db
      .select({ prefs: users.emailPrefs })
      .from(users)
      .where(eq(users.id, current.dbUser.id))
      .limit(1);
    return (row?.prefs as EmailPrefs | null) ?? {};
  } catch {
    return {};
  }
}

const schema = z.object({
  all: z.boolean(),
  messages: z.boolean(),
  applications: z.boolean(),
  collaborations: z.boolean(),
  campaigns: z.boolean(),
  reviews: z.boolean(),
  newsletter: z.boolean(),
});

/** Email-beállítások mentése (saját). */
export async function updateEmailPrefs(input: z.input<typeof schema>) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen beállítások." };

  try {
    await db
      .update(users)
      .set({ emailPrefs: parsed.data, updatedAt: new Date() })
      .where(eq(users.id, current.dbUser.id));
  } catch {
    return { error: "Nem sikerült menteni (lehet, hogy az adatbázis-migráció hiányzik)." };
  }

  revalidatePath("/creator/settings");
  revalidatePath("/brand/settings");
  return { success: true };
}
