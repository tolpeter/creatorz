"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setUserApproved, setAdminFeatured, setCreatorVerified } from "@/app/actions/admin";

export function CreatorAdminActions({
  userId,
  creatorId,
  approved,
  adminFeatured,
  verified,
}: {
  userId: string;
  creatorId: string;
  approved: boolean;
  adminFeatured: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success("Mentve");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {!approved && (
        <Button size="sm" disabled={pending} onClick={() => run(() => setUserApproved(userId, true))}>
          Jóváhagyás
        </Button>
      )}
      <div className="flex items-center gap-2">
        <Label className="text-xs">Hitelesített</Label>
        <Switch
          checked={verified}
          onCheckedChange={(v) => run(() => setCreatorVerified(creatorId, v))}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs">Kiemelt</Label>
        <Switch
          checked={adminFeatured}
          onCheckedChange={(v) => run(() => setAdminFeatured(creatorId, v))}
        />
      </div>
    </div>
  );
}
