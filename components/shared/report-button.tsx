"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { REPORT_REASONS } from "@/lib/constants";
import { submitReport } from "@/app/actions/reports";

export function ReportButton({
  targetType,
  targetId,
  className,
  label = "Jelentés",
}: {
  targetType: "creator" | "ad";
  targetId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [note, setNote] = useState("");

  async function submit() {
    setLoading(true);
    const res = await submitReport({ targetType, targetId, reason, note });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Köszönjük a bejelentést. Kivizsgáljuk.");
    setOpen(false);
    setNote("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
          }
        >
          <Flag className="h-3.5 w-3.5" /> {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tartalom bejelentése</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ok</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Részletek (opcionális)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A bejelentések névtelenek a bejelentett fél felé, és a moderátorok kivizsgálják.
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={loading}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Bejelentés küldése
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
