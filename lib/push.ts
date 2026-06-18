import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushTokens } from "@/lib/db/schema";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Expo push értesítés küldése a megadott felhasználók eszközeire (best-effort).
 * A push CSAK dev/production buildben érkezik meg — Expo Go-ban nem.
 */
export async function sendExpoPush(userIds: string[], payload: PushPayload) {
  try {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;

    const rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(inArray(pushTokens.userId, ids));
    const tokens = rows.map((r) => r.token).filter((t) => t?.startsWith("ExponentPushToken"));
    if (tokens.length === 0) return;

    const messages = tokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: "default" as const,
    }));

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch {
    // best-effort: a push hibája ne akadályozzon semmit
  }
}
