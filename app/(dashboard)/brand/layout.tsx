import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { BrandSidebar } from "@/components/brand/brand-sidebar";

export default async function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  if (current.dbUser.role !== "brand") {
    redirect(current.dbUser.role === "creator" ? "/creator" : "/admin");
  }

  // Olvasatlan üzenetek (where toUserId = me AND read = false)
  const unreadRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false)),
    );
  const unreadMessages = unreadRows[0]?.n ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:gap-8 lg:py-8">
      <aside className="sticky top-[60px] z-30 pb-2 md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:pb-0 md:pr-1">
        <BrandSidebar unreadMessages={unreadMessages} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
