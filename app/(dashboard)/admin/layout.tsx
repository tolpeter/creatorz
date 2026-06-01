import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  if (current.dbUser.role !== "admin") {
    redirect(current.dbUser.role === "creator" ? "/creator" : "/brand");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row">
      <aside className="md:sticky md:top-6 md:self-start">
        <AdminSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
