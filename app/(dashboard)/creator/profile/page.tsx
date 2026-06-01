import { redirect } from "next/navigation";
import { getCurrentCreator } from "@/lib/auth";
import {
  ProfileEditor,
  type ProfileEditorInitial,
} from "@/components/creator/profile-editor";

export const metadata = { title: "Profil szerkesztése" };

export default async function CreatorProfilePage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const p = creator.profile;
  const eq = p.equipment ?? {};
  const initial: ProfileEditorInitial = {
    username: p.username,
    displayName: p.displayName,
    bio: p.bio ?? "",
    city: p.city ?? "",
    county: p.county ?? "",
    age: p.age != null ? String(p.age) : "",
    gender: p.gender ?? "",
    categories: p.categories ?? [],
    languages: p.languages ?? ["hu"],
    avatarUrl: p.avatarUrl ?? null,
    bannerUrl: p.bannerUrl ?? null,
    equipment: {
      phone: eq.phone ?? "",
      camera: eq.camera ?? "",
      microphone: eq.microphone ?? "",
      editing: eq.editing ?? "",
    },
    instagramUrl: p.instagramUrl ?? "",
    instagramFollowers: p.instagramFollowers != null ? String(p.instagramFollowers) : "",
    tiktokUrl: p.tiktokUrl ?? "",
    tiktokFollowers: p.tiktokFollowers != null ? String(p.tiktokFollowers) : "",
    facebookUrl: p.facebookUrl ?? "",
    facebookFollowers: p.facebookFollowers != null ? String(p.facebookFollowers) : "",
    youtubeUrl: p.youtubeUrl ?? "",
    youtubeSubscribers: p.youtubeSubscribers != null ? String(p.youtubeSubscribers) : "",
    rateCard: (p.rateCard ?? []) as ProfileEditorInitial["rateCard"],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil szerkesztése</h1>
        <p className="text-muted-foreground">
          Minden fül külön menthető.
        </p>
      </div>
      <ProfileEditor initial={initial} />
    </div>
  );
}
