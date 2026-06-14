"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSavedCreator } from "@/app/actions/saved";

/**
 * Mentés gomb a böngésző-kártya sarkába (ikon).
 * A meglévő saved_creators rendszert használja (toggleSavedCreator).
 * canSave=false esetén bejelentkezésre irányít.
 */
export function FavoriteButton({
  creatorId,
  initialSaved,
  canSave,
}: {
  creatorId: string;
  initialSaved: boolean;
  canSave: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canSave) {
      toast.info("Jelentkezz be márkaként a mentéshez.");
      router.push("/login");
      return;
    }
    const next = !saved;
    setSaved(next); // optimista
    start(async () => {
      const res = await toggleSavedCreator(creatorId);
      if (res.error) {
        setSaved(!next);
        toast.error(res.error);
      } else {
        setSaved(!!res.saved);
        toast.success(res.saved ? "Mentve a listádra" : "Eltávolítva a mentettekből");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={saved ? "Mentés eltávolítása" : "Mentés"}
      aria-pressed={saved}
      className={cn(
        "absolute right-3 top-3 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm backdrop-blur transition-colors",
        saved ? "bg-accent text-black" : "bg-white/90 text-foreground hover:bg-accent",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      )}
    </button>
  );
}
