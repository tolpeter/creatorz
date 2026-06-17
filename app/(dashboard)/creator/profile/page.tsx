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
  const verified = Boolean(p.verified);
  const initial: ProfileEditorInitial = {
    username: p.username,
    displayName: p.displayName,
    bio: p.bio ?? "",
    city: p.city ?? "",
    county: p.county ?? "",
    birthDate: p.birthDate ?? "",
    gender: p.gender ?? "",
    categories: p.categories ?? [],
    languages: p.languages ?? ["hu"],
    avatarUrl: p.avatarUrl ?? null,
    introVideoUrl: p.introVideoUrl ?? null,
    instagramUrl: p.instagramUrl ?? "",
    instagramFollowers: p.instagramFollowers != null ? String(p.instagramFollowers) : "",
    tiktokUrl: p.tiktokUrl ?? "",
    tiktokFollowers: p.tiktokFollowers != null ? String(p.tiktokFollowers) : "",
    facebookUrl: p.facebookUrl ?? "",
    facebookFollowers: p.facebookFollowers != null ? String(p.facebookFollowers) : "",
    youtubeUrl: p.youtubeUrl ?? "",
    youtubeSubscribers: p.youtubeSubscribers != null ? String(p.youtubeSubscribers) : "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil szerkesztése</h1>
        <p className="text-muted-foreground">
          Az egyes fülek külön-külön menthetők, így bármikor frissítheted az
          adataidat.
        </p>
      </div>
      <ProfileEditor initial={initial} verified={verified} />
    </div>
  );
}
