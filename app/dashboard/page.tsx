import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// A bejelentkezett usert a szerepköre szerinti dashboardra irányítja
// (vagy a /verify-email-re, ha még nem erősítette meg az emailcímét).
export default async function DashboardRouter() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login");
  }
  if (!current.dbUser) {
    // Auth user létezik, de nincs app-rekord és nincs role metadata.
    redirect("/login?missing_account=1");
  }

  const [row] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, current.dbUser.id))
    .limit(1);
  if (row && !row.emailVerified) {
    redirect("/verify-email");
  }

  redirect(dashboardPathForRole(current.dbUser.role));
}
