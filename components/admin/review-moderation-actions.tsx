"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setReviewHidden } from "@/app/actions/admin";

export function ReviewModerationActions({
  reviewId,
  hidden,
}: {
  reviewId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await setReviewHidden(reviewId, !hidden);
      if (res.error) toast.error(res.error);
      else {
        toast.success(hidden ? "Visszaállítva" : "Elrejtve");
        router.refresh();
      }
    });
  }

  return (
    <Button size="sm" variant={hidden ? "outline" : "destructive"} disabled={pending} onClick={toggle}>
      {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {hidden ? "Visszaállítás" : "Elrejtés"}
    </Button>
  );
}
