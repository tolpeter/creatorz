"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createApplication } from "@/app/actions/applications";

export function ApplyModal({ adId, adTitle }: { adId: string; adTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (message.trim().length < 50) {
      toast.error("A pályázati üzenet legalább 50 karakter legyen");
      return;
    }
    setLoading(true);
    const res = await createApplication({
      adId,
      message,
      proposedPriceHuf: price ? Number(price) : 0,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Pályázat elküldve!");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Send className="h-4 w-4" /> Pályázom
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pályázat — {adTitle}</DialogTitle>
          <DialogDescription>
            Mutasd be, miért te vagy a megfelelő creator erre a feladatra.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Pályázati üzenet (min. 50 karakter)</Label>
            <Textarea
              value={message}
              rows={6}
              maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Írd le a koncepciódat, tapasztalataidat…"
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
          </div>
          <div className="space-y-1.5">
            <Label>Ár-ajánlatod (Ft)</Label>
            <Input
              type="number"
              min={1000}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="pl. 30000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Pályázat beküldése
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
