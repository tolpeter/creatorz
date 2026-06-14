"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveAd, rejectAd, setAdFeatured } from "@/app/actions/ads";

export function AdModerationActions({
  adId,
  status,
  featured,
}: {
  adId: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  function approve() {
    start(async () => {
      const res = await approveAd(adId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Hirdetés jóváhagyva");
        router.refresh();
      }
    });
  }

  function reject() {
    start(async () => {
      const res = await rejectAd(adId, reason);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Hirdetés elutasítva");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "active" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs">Kiemelt</Label>
          <Switch
            checked={featured}
            disabled={pending}
            onCheckedChange={(v) =>
              start(async () => {
                const res = await setAdFeatured(adId, v);
                if (res.error) toast.error(res.error);
                else {
                  toast.success("Mentve");
                  router.refresh();
                }
              })
            }
          />
        </div>
      )}
      {status === "pending" && (
        <Button size="sm" disabled={pending} onClick={approve}>
          <Check className="h-4 w-4" /> Jóváhagyás
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <X className="h-4 w-4" /> Elutasítás
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hirdetés elutasítása</DialogTitle>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Elutasítás indoka"
          />
          <DialogFooter>
            <Button variant="destructive" disabled={pending} onClick={reject}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Elutasítás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
