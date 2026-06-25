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

  // Kreatív szakember a saját, egyszerűbb onboardingjára kerül
  if (creator.profile.profileKind === "professional") {
    redirect("/onboarding/professional");
  }

  const p = creator.profile;
  const initial: OnboardingInitial = {
    avatarUrl: p.avatarUrl ?? null,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio ?? "",
    city: p.city ?? "",
    county: p.county ?? "",
    birthDate: p.birthDate ?? "",
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
  };

  const ct = (p.creatorType ?? "ugc") as "ugc" | "influencer" | "model";
  const m = p.modelAttributes ?? {};

  return (
    <div className="w-full max-w-2xl">
      <CreatorOnboardingWizard
        initial={initial}
        creatorType={ct}
        modelInitial={{
          heightCm: m.heightCm != null ? String(m.heightCm) : "",
          weightKg: m.weightKg != null ? String(m.weightKg) : "",
          hairColor: m.hairColor ?? "",
          eyeColor: m.eyeColor ?? "",
          bodyArt: m.bodyArt ?? "",
          modelTypes: m.modelTypes ?? [],
        }}
      />
    </div>
  );
}
