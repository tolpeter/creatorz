"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ImageUploader } from "@/components/creator/image-uploader";
import { updateBrandLogo } from "@/app/actions/brand-profile";
import { updateCreatorAppearance } from "@/app/actions/creator-profile";

/**
 * Profilkép-emlékeztető pop-up: ha a bejelentkezett felhasználónak (creator
 * vagy márka) még nincs profilképe/logója, minden belépéskor felugrik egy
 * ablak, ahol egy kattintással feltöltheti. Feltöltés után nem jelenik meg.
 */
export function ProfilePhotoPrompt({ role }: { role: "brand" | "creator" }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [url, setUrl] = useState<string | null>(null);

  if (!open) return null;
  const isBrand = role === "brand";

  async function handleChange(next: string | null) {
    setUrl(next);
    if (!next) return;
    const res = isBrand
      ? await updateBrandLogo({ logoUrl: next })
      : await updateCreatorAppearance({ avatarUrl: next });
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isBrand ? "Logó mentve! 🎉" : "Profilkép mentve! 🎉");
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Bezárás"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold">
          {isBrand ? "Tölts fel egy logót!" : "Tölts fel egy profilképet!"}
        </h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          {isBrand
            ? "A logó megbízhatóbb benyomást kelt a tartalomgyártók felé, és megjelenik a hirdetéseiden."
            : "A profilképpel sokkal többen kattintanak a profilodra, és bizalmat kelt a márkák felé."}
        </p>

        <div className="mt-5 flex justify-center">
          <ImageUploader
            bucket={isBrand ? "logos" : "avatars"}
            variant="avatar"
            label={isBrand ? "Logó" : "Profilkép"}
            value={url}
            onChange={handleChange}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mx-auto mt-5 block text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Most kihagyom
        </button>
      </div>
    </div>
  );
}
