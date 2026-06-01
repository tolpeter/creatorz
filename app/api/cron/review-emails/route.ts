import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { collaborations, brandProfiles, creatorProfiles, users } from "@/lib/db/schema";
import { and, eq, lte, isNull } from "drizzle-orm";
import { sendEmailSafe } from "@/lib/resend/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pending = await db
    .select({
      id: collaborations.id,
      reviewToken: collaborations.reviewToken,
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
      brandEmail: users.email,
    })
    .from(collaborations)
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(users, eq(users.id, brandProfiles.userId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(
      and(
        lte(collaborations.acceptedAt, sevenDaysAgo),
        isNull(collaborations.reviewEmailSentAt),
        eq(collaborations.status, "active")
      )
    );

  let sent = 0;
  for (const collab of pending) {
    const token = collab.reviewToken ?? randomBytes(32).toString("hex");

    await db
      .update(collaborations)
      .set({ reviewToken: token, reviewEmailSentAt: new Date(), status: "review_pending" })
      .where(eq(collaborations.id, collab.id));

    await sendEmailSafe({
      to: collab.brandEmail,
      subject: `Hogyan ment a közös munka ${collab.creatorName}-rel?`,
      html: `
        <h2>Értékeld a közös munkát</h2>
        <p>Szia! A(z) <strong>${collab.creatorName}</strong> creatorral való együttműködésetek után
        kíváncsiak vagyunk a tapasztalataidra.</p>
        <p><a href="${APP_URL}/review/${token}">Értékelés kitöltése (1 perc)</a></p>
      `,
    });
    sent++;
  }

  return Response.json({ sent });
}
