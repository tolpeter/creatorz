"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessageSquare, Flag } from "lucide-react";
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
import { respondToReview, reportReview } from "@/app/actions/reviews";

export function ReviewActions({
  reviewId,
  hasResponse,
  reported,
}: {
  reviewId: string;
  hasResponse: boolean;
  reported: boolean;
}) {
  const router = useRouter();
  const [respondOpen, setRespondOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitResponse() {
    if (!responseText.trim()) return toast.error("Írd meg a választ");
    setLoading(true);
    const res = await respondToReview({ reviewId, text: responseText });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Válasz elmentve");
    setRespondOpen(false);
    setResponseText("");
    router.refresh();
  }

  async function submitReport() {
    setLoading(true);
    const res = await reportReview(reviewId, reportReason);
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Bejelentés elküldve — egy admin átnézi");
    setReportOpen(false);
    setReportReason("");
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2">
      {!hasResponse && (
        <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4" /> Válaszolok
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Válasz az értékelésre</DialogTitle>
              <DialogDescription>
                A válaszod a profilodon, az értékelés alatt jelenik meg.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Válasz (max 500 karakter)</Label>
              <Textarea
                value={responseText}
                rows={4}
                maxLength={500}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={submitResponse} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Beküldés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" disabled={reported}>
            <Flag className="h-4 w-4" /> {reported ? "Bejelentve" : "Bejelentem"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Értékelés bejelentése</DialogTitle>
            <DialogDescription>
              Ha az értékelés sértő vagy valótlan, jelezd nekünk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Indok</Label>
            <Textarea
              value={reportReason}
              rows={3}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Miért jelented be ezt az értékelést?"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitReport} disabled={loading} variant="destructive">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Bejelentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
