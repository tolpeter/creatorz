"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { headers } from "next/headers";

const schema = z.object({
  email: z.string().email("Adj meg egy érvényes email címet").max(200),
  source: z.enum(["footer", "app_popup"]).optional().default("footer"),
});

/**
 * Hírlevél-feliratkozás — a lábléc és az app-popup egyaránt ide gyűjti az
 * email-címeket (egy helyen, később bármilyen hírlevél küldhető nekik).
 * Idempotens: ha már fel van iratkozva, sikerként tér vissza.
 */
export async function subscribeNewsletter(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen email" };
  }
  const { email, source } = parsed.data;

  // Egyszerű spam-védelem IP alapján.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const limit = checkRateLimit(`newsletter:${ip}`, 10, HOUR);
  if (!limit.allowed) {
    return { error: "Túl sok próbálkozás. Próbáld később." };
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: email.toLowerCase(), source })
    .onConflictDoNothing({ target: newsletterSubscribers.email });

  return { success: true };
}
