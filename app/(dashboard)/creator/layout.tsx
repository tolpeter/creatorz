import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row">
      <aside className="md:sticky md:top-6 md:self-start">
        <CreatorSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
