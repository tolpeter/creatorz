"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader } from "@/components/creator/image-uploader";
import { updateBrandLogo } from "@/app/actions/brand-profile";

/**
 * Vezérlőpulti logó-feltöltő a márkáknak — közvetlenül a dashboardról
 * tölthetik fel / cserélhetik a logójukat (azonnal mentődik).
 */
export function BrandLogoUpload({ initialUrl }: { initialUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);

  async function handleChange(next: string | null) {
    setUrl(next);
    const res = await updateBrandLogo({ logoUrl: next });
    if (res.error) return toast.error(res.error);
    toast.success(next ? "Logó mentve!" : "Logó törölve");
    router.refresh();
  }

  return (
    <ImageUploader
      bucket="logos"
      variant="avatar"
      label="Logó"
      value={url}
      onChange={handleChange}
    />
  );
}
