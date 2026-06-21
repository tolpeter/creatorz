import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminAdCreator } from "@/components/admin/admin-ad-creator";

export const metadata = { title: "Admin — Új hirdetés" };

export default async function AdminNewAdPage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const brands = await db
    .select({ id: brandProfiles.id, name: brandProfiles.companyName })
    .from(brandProfiles)
    .orderBy(asc(brandProfiles.companyName))
    .limit(500);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Új hirdetés (admin)</h1>
        <p className="text-muted-foreground">
          Hirdetés feladása egy márka nevében — ha valaki közvetlenül téged kér meg rá.
        </p>
      </div>
      <AdminAdCreator brands={brands} />
    </div>
  );
}
