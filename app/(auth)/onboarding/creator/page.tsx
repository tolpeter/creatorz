import { redirect } from "next/navigation";
import { getCurrentCreator, getCurrentUser } from "@/lib/auth";
import {
  CreatorOnboardingWizard,
  type OnboardingInitial,
} from "@/components/creator/creator-onboarding-wizard";

export const metadata = { title: "Tartalomgyártó onboarding" };

export default async function CreatorOnboardingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.dbUser?.role === "brand") redirect("/brand");

  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const p = creator.profile;
  const initial: OnboardingInitial = {
    username: p.username,
    displayName: p.displayName,
    bio: p.bio ?? "",
    city: p.city ?? "",
    county: p.county ?? "",
    age: p.age != null ? String(p.age) : "",
    gender: p.gender ?? "",
    categories: p.categories ?? [],
    languages: p.languages ?? ["hu"],
    instagramUrl: p.instagramUrl ?? "",
    instagramFollowers: p.instagramFollowers != null ? String(p.instagramFollowers) : "",
    tiktokUrl: p.tiktokUrl ?? "",
    tiktokFollowers: p.tiktokFollowers != null ? String(p.tiktokFollowers) : "",
    facebookUrl: p.facebookUrl ?? "",
    facebookFollowers: p.facebookFollowers != null ? String(p.facebookFollowers) : "",
    youtubeUrl: p.youtubeUrl ?? "",
    youtubeSubscribers: p.youtubeSubscribers != null ? String(p.youtubeSubscribers) : "",
    rateCard: (p.rateCard ?? []) as OnboardingInitial["rateCard"],
  };

  return (
    <div className="w-full max-w-2xl">
      <CreatorOnboardingWizard initial={initial} />
    </div>
  );
}
