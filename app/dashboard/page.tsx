import { redirect } from "next/navigation";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";

// A bejelentkezett usert a szerepköre szerinti dashboardra irányítja.
export default async function DashboardRouter() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login");
  }
  if (!current.dbUser) {
    // Auth user létezik, de nincs app-rekord — küldjük az onboarding elejére
    redirect("/login");
  }

  redirect(dashboardPathForRole(current.dbUser.role));
}
