import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailCampaignRecipients } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

/**
 * Követett CTA-link: rögzíti a kattintást (megnyitást is, ha még nem volt),
 * majd átirányít a profilszerkesztőre, ahol a creator feltöltheti a képét.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let dest = `${APP_URL}/creator/profile`;

  if (token) {
    try {
      // Kampány szerint eltérő cél: az onboarding-emlékeztető a profil
      // befejezésére visz (/creator → onboarding), minden más a szerkesztőre.
      const [rec] = await db
        .select({ campaign: emailCampaignRecipients.campaign })
        .from(emailCampaignRecipients)
        .where(eq(emailCampaignRecipients.token, token))
        .limit(1);
      if (rec?.campaign?.startsWith("onboarding")) {
        dest = `${APP_URL}/creator`;
      }

      // Kattintás rögzítése (csak az elsőt).
      await db
        .update(emailCampaignRecipients)
        .set({ clickedAt: new Date() })
        .where(
          and(
            eq(emailCampaignRecipients.token, token),
            isNull(emailCampaignRecipients.clickedAt),
          ),
        );
      // Kattintás = megnyitás is (ha a pixel nem töltött be).
      await db
        .update(emailCampaignRecipients)
        .set({ openedAt: new Date() })
        .where(
          and(
            eq(emailCampaignRecipients.token, token),
            isNull(emailCampaignRecipients.openedAt),
          ),
        );
    } catch {
      // best-effort — az átirányítás akkor is megtörténik
    }
  }

  return Response.redirect(dest, 302);
}
