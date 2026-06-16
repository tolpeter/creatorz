"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader } from "@/components/creator/image-uploader";
import { updateCreatorAppearance } from "@/app/actions/creator-profile";

/**
 * Vezérlőpult avatar-feltöltő: a creator a dashboardon közvetlenül feltöltheti
 * / cserélheti a profilképét — nem kell a profil-szerkesztőt megkeresnie.
 * A változás azonnal mentődik (updateCreatorAppearance).
 */
export function DashboardAvatarUpload({
  initialUrl,
}: {
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);

  async function handleChange(next: string | null) {
    setUrl(next);
    const res = await updateCreatorAppearance({ avatarUrl: next });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(next ? "Profilkép mentve!" : "Profilkép törölve");
    router.refresh();
  }

  return (
    <ImageUploader
      bucket="avatars"
      variant="avatar"
      label="Profilkép"
      value={url}
      onChange={handleChange}
    />
  );
}
