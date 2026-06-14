import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderVerificationEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOKEN_VALID_HOURS = 24;

/**
 * Új ellenőrző tokent generál a usernek, lementi a DB-be lejárati idővel,
 * majd küld egy magyar nyelvű ellenőrző emailt. Best-effort: ha az email
 * küldése nem sikerül, akkor is visszatér token-nel (újraküldhető a UI-ról).
 */
export async function sendVerificationEmail(input: {
  userId: string;
  email: string;
  displayName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VALID_HOURS * 60 * 60 * 1000);

  await db
    .update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));

  const link = `${APP_URL}/verify-email/${token}`;
  const name = input.displayName?.trim() || "Felhasználó";

  const { subject, html } = renderVerificationEmail({
    name,
    verifyUrl: link,
    hoursValid: TOKEN_VALID_HOURS,
  });
  const res = await sendEmailSafe({ to: input.email, subject, html });

  return { sent: res.sent, error: res.error };
}
