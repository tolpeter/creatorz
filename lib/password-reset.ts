import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderPasswordResetEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOKEN_VALID_HOURS = 2;

/**
 * Saját jelszó-visszaállítás (Supabase-től független, branded Resend email).
 * Biztonsági okból akkor is "success"-szel tér vissza, ha az email nem
 * létezik — nem áruljuk el, hogy van-e ilyen fiók.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (!user) return;

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VALID_HOURS * 60 * 60 * 1000);

  await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Megszólító név (creator → displayName, brand → companyName).
  let name: string | undefined;
  if (user.role === "creator") {
    const [p] = await db
      .select({ n: creatorProfiles.displayName })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    name = p?.n ?? undefined;
  } else if (user.role === "brand") {
    const [p] = await db
      .select({ n: brandProfiles.companyName })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, user.id))
      .limit(1);
    name = p?.n ?? undefined;
  }

  const resetUrl = `${APP_URL}/reset-password/${token}`;
  const { subject, html } = renderPasswordResetEmail({
    name,
    resetUrl,
    hoursValid: TOKEN_VALID_HOURS,
  });
  await sendEmailSafe({ to: user.email, subject, html });
}
