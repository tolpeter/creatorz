"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/shared/star-rating-input";
import { submitReview } from "@/app/actions/reviews";

export function ReviewForm({
  token,
  creatorName,
}: {
  token: string;
  creatorName: string;
}) {
  const [overall, setOverall] = useState(0);
  const [comm, setComm] = useState(0);
  const [quality, setQuality] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (![overall, comm, quality, deadline].every((r) => r >= 1)) {
      toast.error("Adj meg minden csillagos értékelést");
      return;
    }
    if (text.trim().length < 30) {
      toast.error("Az értékelés legalább 30 karakter legyen");
      return;
    }
    setLoading(true);
    const res = await submitReview(token, {
      overallRating: overall,
      communicationRating: comm,
      qualityRating: quality,
      deadlineRating: deadline,
      text,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setDone(true);
    toast.success("Köszönjük az értékelést!");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-accent" />
        <h2 className="text-xl font-bold">Köszönjük az értékelést!</h2>
        <p className="text-muted-foreground">
          A visszajelzésed megjelenik {creatorName} profilján.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-lg border p-4">
        <StarRatingInput value={overall} onChange={setOverall} label="Összességében" />
        <StarRatingInput value={comm} onChange={setComm} label="Kommunikáció" />
        <StarRatingInput value={quality} onChange={setQuality} label="Minőség" />
        <StarRatingInput value={deadline} onChange={setDeadline} label="Határidő tartása" />
      </div>
      <div className="space-y-1.5">
        <Label>Szöveges értékelés (min. 30 karakter)</Label>
        <Textarea
          value={text}
          rows={5}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Milyen volt a közös munka?"
        />
        <p className="text-right text-xs text-muted-foreground">{text.length}/2000</p>
      </div>
      <Button onClick={submit} disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Értékelés beküldése
      </Button>
    </div>
  );
}
