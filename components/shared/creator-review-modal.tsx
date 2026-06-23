"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { submitCreatorReview } from "@/app/actions/reviews";

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} csillag`}>
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                n <= value ? "fill-accent text-accent" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Márka → tartalomgyártó értékelés a lezárt együttműködésről. */
export function CreatorReviewModal({
  collabId,
  creatorName,
}: {
  collabId: string;
  creatorName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overall, setOverall] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [quality, setQuality] = useState(5);
  const [deadline, setDeadline] = useState(5);
  const [text, setText] = useState("");

  async function submit() {
    if (text.trim().length < 30) {
      toast.error("Az értékelés legalább 30 karakter legyen.");
      return;
    }
    setLoading(true);
    const res = await submitCreatorReview(collabId, {
      overallRating: overall,
      communicationRating: communication,
      qualityRating: quality,
      deadlineRating: deadline,
      text,
    });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Köszönjük az értékelést!");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent">
          <Star className="h-4 w-4" /> Értékeld a tartalomgyártót
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Értékeld: {creatorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <StarRow label="Összbenyomás" value={overall} onChange={setOverall} />
          <StarRow label="Kommunikáció" value={communication} onChange={setCommunication} />
          <StarRow label="Minőség" value={quality} onChange={setQuality} />
          <StarRow label="Határidő-tartás" value={deadline} onChange={setDeadline} />
          <Textarea
            rows={4}
            maxLength={2000}
            placeholder="Milyen volt a közös munka? (min. 30 karakter)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            Értékelés küldése
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
