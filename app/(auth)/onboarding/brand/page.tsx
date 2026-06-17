import { redirect } from "next/navigation";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { BrandOnboardingForm } from "@/components/brand/brand-onboarding-form";

export const metadata = { title: "Márka onboarding" };

export default async function BrandOnboardingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.dbUser?.role === "creator") redirect("/creator");

  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const p = brand.profile;
  return (
    <BrandOnboardingForm
      initial={{
        companyName: p.companyName ?? "",
        websiteUrl: p.websiteUrl ?? "",
        contactName: p.contactName ?? "",
        industry: p.industry ?? "",
        address: p.address ?? "",
      }}
    />
  );
}
