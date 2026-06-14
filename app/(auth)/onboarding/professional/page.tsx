import { redirect } from "next/navigation";
import { getCurrentCreator, getCurrentUser } from "@/lib/auth";
import {
  ProfessionalOnboardingWizard,
  type ProfessionalOnboardingInitial,
} from "@/components/creator/professional-onboarding-wizard";

export const metadata = { title: "Kreatív szakember onboarding" };

export default async function ProfessionalOnboardingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.dbUser?.role === "brand") redirect("/brand");

  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const p = creator.profile;
  const initial: ProfessionalOnboardingInitial = {
    username: p.username,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio ?? "",
    city: p.city ?? "",
    county: p.county ?? "",
    professionalRoles: p.professionalRoles ?? [],
    specialties: p.specialties ?? [],
    websiteUrl: p.websiteUrl ?? "",
    instagramUrl: p.instagramUrl ?? "",
  };

  return (
    <div className="w-full max-w-2xl">
      <ProfessionalOnboardingWizard initial={initial} />
    </div>
  );
}
