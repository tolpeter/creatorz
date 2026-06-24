"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CalendarX, Loader2, Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setAdStatus, deleteAd, restoreAd } from "@/app/actions/ads";

/**
 * Kampány-életciklus gombok: felfüggesztés / újraaktiválás / lejárt / törlés
 * (és adminnál a törölt kampány visszaállítása). A jogosultságot a szerver
 * dönti el (a márka a sajátját, az admin bármelyiket).
 */
export function AdLifecycleActions({
  adId,
  status,
  deleted = false,
  size = "sm",
}: {
  adId: string;
  status: string;
  deleted?: boolean;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        setConfirmDelete(false);
        router.refresh();
      }
    });
  }

  // Archívum-nézet: csak visszaállítás.
  if (deleted) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled={pending}
        onClick={() => run(() => restoreAd(adId), "Kampány visszaállítva")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Visszaállítás
      </Button>
    );
  }

  const canSuspend = status === "active";
  const canReactivate = status === "suspended" || status === "expired" || status === "closed";
  const canExpire = status === "active" || status === "suspended";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSuspend && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setAdStatus(adId, "suspended"), "Kampány felfüggesztve")}
        >
          <Ban className="h-4 w-4" /> Felfüggesztés
        </Button>
      )}
      {canReactivate && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setAdStatus(adId, "active"), "Kampány újraaktiválva")}
        >
          <Play className="h-4 w-4" /> Aktiválás
        </Button>
      )}
      {canExpire && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setAdStatus(adId, "expired"), "Kampány lejártra állítva")}
        >
          <CalendarX className="h-4 w-4" /> Lejárt
        </Button>
      )}
      <Button
        size={size}
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        disabled={pending}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="h-4 w-4" /> Törlés
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampány törlése</DialogTitle>
            <DialogDescription>
              A kampány az Archívumba kerül (nem jelenik meg sehol), de az admin bármikor
              visszanézheti és visszaállíthatja. Biztosan törlöd?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Mégse
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteAd(adId), "Kampány az Archívumba került")}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Törlés (archívum)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
