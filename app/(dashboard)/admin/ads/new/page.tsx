import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminAdCreator } from "@/components/admin/admin-ad-creator";

export const metadata = { title: "Admin — Új kampány" };

export default async function AdminNewAdPage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const allBrands = await db
    .select({ id: brandProfiles.id, name: brandProfiles.companyName })
    .from(brandProfiles)
    .orderBy(asc(brandProfiles.companyName))
    .limit(500);

  // A saját "Creatorz.hu" márka kerüljön előre és legyen alapból kiválasztva.
  const ownBrand = allBrands.find((b) => b.name === "Creatorz.hu");
  const brands = ownBrand
    ? [ownBrand, ...allBrands.filter((b) => b.id !== ownBrand.id)]
    : allBrands;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Új kampány (admin)</h1>
        <p className="text-muted-foreground">
          Kampány feladása egy márka nevében — alapból a saját <strong>Creatorz.hu</strong> profil,
          de bármelyik márka nevében is feladhatod.
        </p>
      </div>
      <AdminAdCreator brands={brands} defaultBrandId={ownBrand?.id ?? ""} />
    </div>
  );
}
