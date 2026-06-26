"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader } from "@/components/creator/image-uploader";
import { adminUpdateBrandLogo } from "@/app/actions/brand-profile";

/**
 * Admin logó-feltöltő egy adott márkához (pl. a saját Creatorz.hu profil).
 * A logó a publikus hirdetés-kártyán a márka avatarjaként jelenik meg.
 */
export function AdminBrandLogo({
  brandId,
  initialUrl,
}: {
  brandId: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);

  async function handleChange(next: string | null) {
    setUrl(next);
    const res = await adminUpdateBrandLogo(brandId, { logoUrl: next });
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
