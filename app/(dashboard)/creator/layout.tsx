import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { CreatorSidebar } from "@/components/creator/creator-sidebar";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  if (current.dbUser.role !== "creator") {
    redirect(current.dbUser.role === "brand" ? "/brand" : "/admin");
  }

  const unreadRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false)));
  const unreadMessages = unreadRows[0]?.n ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row">
      <aside className="md:sticky md:top-6 md:self-start">
        <CreatorSidebar unreadMessages={unreadMessages} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
