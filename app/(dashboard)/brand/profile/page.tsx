import { redirect } from "next/navigation";
import { getCurrentBrand } from "@/lib/auth";
import {
  BrandProfileEditor,
  type BrandProfileInitial,
} from "@/components/brand/brand-profile-editor";

export const metadata = { title: "Cég profil" };

export default async function BrandProfilePage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");
  const p = brand.profile;

  const initial: BrandProfileInitial = {
    companyName: p.companyName ?? "",
    websiteUrl: p.websiteUrl ?? "",
    logoUrl: p.logoUrl ?? null,
    contactName: p.contactName ?? "",
    contactPhone: p.contactPhone ?? "",
    industry: p.industry ?? "",
    taxNumber: p.taxNumber ?? "",
    address: p.address ?? "",
    description: p.description ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cég profil</h1>
        <p className="text-muted-foreground">A márkád adatai.</p>
      </div>
      <BrandProfileEditor initial={initial} />
    </div>
  );
}
