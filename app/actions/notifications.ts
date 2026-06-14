"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

/** A bejelentkezett felhasználó legutóbbi értesítései + olvasatlanok száma. */
export async function getNotifications(limit = 15): Promise<{
  items: NotificationItem[];
  unread: number;
}> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { items: [], unread: 0 };

  const [items, unreadRows] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, current.dbUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, current.dbUser.id), eq(notifications.read, false))),
  ]);

  return { items, unread: unreadRows[0]?.n ?? 0 };
}

export async function markNotificationRead(id: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, current.dbUser.id)));
  return { success: true };
}

export async function markAllNotificationsRead() {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, current.dbUser.id), eq(notifications.read, false)));
  return { success: true };
}
