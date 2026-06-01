import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row">
      <aside className="md:sticky md:top-6 md:self-start">
        <BrandSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
