import "server-only";
import { Resend } from "resend";

export const EMAIL_FROM = process.env.EMAIL_FROM || "Creatorz <onboarding@resend.dev>";

let cachedClient: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) cachedClient = new Resend(process.env.RESEND_API_KEY);
  return cachedClient;
}

/**
 * Best-effort email küldés — sosem dobja el a hívó action-t, ha a küldés
 * nem sikerül (pl. nem verifikált domain dev közben, vagy hiányzó env).
 *
 * A Resend klienst lazán példányosítjuk — különben a `new Resend(undefined)`
 * build-time crash-elne, ha az env-változó még nincs beállítva.
 */
export async function sendEmailSafe(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const client = getResend();
  if (!client) {
    return { sent: false, error: "RESEND_API_KEY hiányzik" };
  }
  try {
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[email] Resend send HIBA:", {
        from: EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        message: error.message,
        name: error.name,
      });
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] Resend exception:", {
      from: EMAIL_FROM,
      to: opts.to,
      message: (e as Error).message,
    });
    return { sent: false, error: (e as Error).message };
  }
}
