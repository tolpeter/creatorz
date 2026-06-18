"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSavedCreator } from "@/app/actions/saved";

export function SaveCreatorButton({
  creatorId,
  initialSaved,
  className,
}: {
  creatorId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await toggleSavedCreator(creatorId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSaved(!!res.saved);
      toast.success(res.saved ? "Mentve a kedvencekhez" : "Eltávolítva a kedvencekből");
    });
  }

  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={pending} className={className}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", saved && "fill-accent text-accent")} />
      )}
      {saved ? "Mentve" : "Mentés"}
    </Button>
  );
}
