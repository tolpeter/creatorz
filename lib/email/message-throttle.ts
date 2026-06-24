import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { isEmailAllowed } from "@/lib/email/prefs";

/**
 * Üzenet-értesítő email throttle: CSAK az első olvasatlan üzenetnél küldünk
 * emailt a címzettnek. Amíg el nem olvassa az üzeneteit, a további üzenetekről
 * NEM küldünk újabb emailt — így nem spammelünk és a Resend napi/havi limit
 * alatt maradunk. (Az appon belüli értesítés + push minden üzenetnél megy.)
 *
 * Fontos: ezt az üzenet BESZÚRÁSA UTÁN hívd, hogy az új üzenet is beleszámítson.
 */
export async function sendMessageEmailThrottled(
  toUserId: string,
  to: string,
  email: { subject: string; html: string; replyTo?: string },
): Promise<void> {
  // A felhasználó kikapcsolhatta az üzenet-emaileket.
  if (!(await isEmailAllowed(toUserId, "messages"))) return;
  try {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(eq(messages.toUserId, toUserId), eq(messages.read, false)));
    // >1 olvasatlan = már volt korábbi (értesített) üzenet → most nem küldünk.
    if ((row?.n ?? 0) > 1) return;
  } catch {
    // ha a számlálás hibázik, best-effort: inkább elküldjük
  }
  await sendEmailSafe({ to, ...email });
}
