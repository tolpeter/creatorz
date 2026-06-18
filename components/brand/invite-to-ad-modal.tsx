"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { inviteCreatorToAd, type InvitableAd } from "@/app/actions/invitations";

export function InviteToAdModal({
  creatorId,
  creatorName,
  ads,
  triggerClassName,
}: {
  creatorId: string;
  creatorName: string;
  ads: InvitableAd[];
  /** Egyedi stílus a trigger gombhoz (pl. világos témájú listához). */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectableAds = ads.filter((a) => !a.alreadyApplied && !a.alreadyInvited);

  async function submit() {
    if (!selected) {
      toast.error("Válassz egy hirdetést");
      return;
    }
    setLoading(true);
    const res = await inviteCreatorToAd({ adId: selected, creatorId, message });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Meghívás elküldve!");
    setOpen(false);
    setSelected(null);
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-xl border-white/20 bg-white/8 px-5 text-sm font-black text-white hover:bg-white hover:text-black sm:h-12 sm:px-7 sm:text-base",
            triggerClassName,
          )}
        >
          <Megaphone className="h-5 w-5" />
          Meghívás hirdetésre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meghívás hirdetésre — {creatorName}</DialogTitle>
          <DialogDescription>
            Hívd meg ezt a tartalomgyártót, hogy pályázzon az egyik aktív
            hirdetésedre. Értesítést és emailt is kap róla.
          </DialogDescription>
        </DialogHeader>

        {ads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 bg-[#f6f7f2] p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Még nincs aktív hirdetésed. Adj fel egyet, hogy meghívhasd a
              creatorokat.
            </p>
            <Button asChild className="mt-4">
              <Link href="/brand/ads/new">
                <Plus className="h-4 w-4" /> Új hirdetés feladása
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Melyik hirdetésre?</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {ads.map((ad) => {
                  const disabled = ad.alreadyApplied || ad.alreadyInvited;
                  const isSelected = selected === ad.id;
                  return (
                    <button
                      key={ad.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelected(ad.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                        disabled
                          ? "cursor-not-allowed border-black/10 bg-muted/40 text-muted-foreground"
                          : isSelected
                            ? "border-accent bg-accent/10 font-semibold"
                            : "border-black/10 hover:border-accent/60",
                      )}
                    >
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {ad.title}
                      </span>
                      {ad.alreadyApplied ? (
                        <span className="shrink-0 text-xs">Már pályázott</span>
                      ) : ad.alreadyInvited ? (
                        <span className="shrink-0 text-xs">Már meghívva</span>
                      ) : isSelected ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {selectableAds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Erre a creatorra már minden aktív hirdetésednél van pályázat
                  vagy meghívás.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Üzenet (opcionális)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Írd le pár szóban, miért pont őt hívod meg…"
              />
            </div>
          </div>
        )}

        {ads.length > 0 && (
          <DialogFooter>
            <Button
              type="button"
              onClick={submit}
              disabled={loading || !selected}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Meghívás küldése
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
