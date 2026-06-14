"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reports, creatorProfiles, ads, brandProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";
import { REPORT_REASONS } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const REASON_VALUES = REPORT_REASONS.map((r) => r.value) as [string, ...string[]];

const schema = z.object({
  targetType: z.enum(["creator", "ad"]),
  targetId: z.string().uuid(),
  reason: z.enum(REASON_VALUES),
  note: z.string().max(1000).optional(),
});

async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

export async function submitReport(input: z.input<typeof schema>) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Bejelentéshez jelentkezz be." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen bejelentés." };
  const d = parsed.data;

  const rl = checkRateLimit(`report:${current.dbUser.id}`, 10, HOUR);
  if (!rl.allowed) return { error: "Túl sok bejelentés egy óra alatt. Próbáld később." };

  // Target feloldása szerveroldalon (megbízhatóan)
  let targetLabel = "";
  let targetUrl = "";
  let reportedUserId: string | null = null;

  if (d.targetType === "creator") {
    const [c] = await db
      .select({ displayName: creatorProfiles.displayName, username: creatorProfiles.username, userId: creatorProfiles.userId })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, d.targetId))
      .limit(1);
    if (!c) return { error: "A bejelentett profil nem található." };
    targetLabel = c.displayName;
    targetUrl = `/creators/${c.username}`;
    reportedUserId = c.userId;
  } else {
    const [a] = await db
      .select({ title: ads.title, brandUserId: brandProfiles.userId })
      .from(ads)
      .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
      .where(eq(ads.id, d.targetId))
      .limit(1);
    if (!a) return { error: "A bejelentett hirdetés nem található." };
    targetLabel = a.title;
    targetUrl = `/ads/${d.targetId}`;
    reportedUserId = a.brandUserId;
  }

  if (reportedUserId === current.dbUser.id) {
    return { error: "A saját tartalmadat nem jelentheted." };
  }

  // Duplikátum-védelem: ugyanaz a bejelentő + target + nyitott
  const dupe = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterUserId, current.dbUser.id),
        eq(reports.targetType, d.targetType),
        eq(reports.targetId, d.targetId),
        eq(reports.status, "open"),
      ),
    )
    .limit(1);
  if (dupe.length > 0) return { error: "Ezt már bejelentetted, vizsgáljuk." };

  await db.insert(reports).values({
    reporterUserId: current.dbUser.id,
    reportedUserId,
    targetType: d.targetType,
    targetId: d.targetId,
    targetLabel,
    targetUrl,
    reason: d.reason,
    note: d.note || null,
  });

  if (ADMIN_EMAIL) {
    const reasonLabel = REPORT_REASONS.find((r) => r.value === d.reason)?.label ?? d.reason;
    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: "Új tartalom-bejelentés – Creatorz",
      html: `
        <h2>Új bejelentés</h2>
        <p><strong>Típus:</strong> ${d.targetType === "creator" ? "Tartalomgyártó" : "Hirdetés"}</p>
        <p><strong>Tartalom:</strong> ${targetLabel}</p>
        <p><strong>Ok:</strong> ${reasonLabel}</p>
        ${d.note ? `<p><strong>Megjegyzés:</strong> ${d.note}</p>` : ""}
        <p><a href="${APP_URL}/admin/reports">Megnyitás az admin panelen</a></p>
      `,
    });
  }

  return { success: true };
}

export async function resolveReport(id: string, status: "resolved" | "dismissed") {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(reports)
    .set({ status, resolvedAt: new Date() })
    .where(eq(reports.id, id));
  revalidatePath("/admin/reports");
  return { success: true };
}
