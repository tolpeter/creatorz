"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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
import { sendMessage } from "@/app/actions/messages";

export function SendMessageModal({
  toUsername,
  creatorName,
}: {
  toUsername: string;
  creatorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim()) {
      toast.error("Írd meg az üzenetet");
      return;
    }
    setLoading(true);
    const res = await sendMessage({
      toUsername,
      subject,
      body,
      budgetHint: budget ? Number(budget) : null,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Üzenet elküldve!");
    setOpen(false);
    setSubject("");
    setBody("");
    setBudget("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4" /> Üzenetet küldök
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Üzenet — {creatorName}</DialogTitle>
          <DialogDescription>
            Írd le, milyen együttműködésre gondolsz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tárgy (opcionális)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="pl. Termékvideó együttműködés"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Üzenet</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Mutatkozz be és írd le a projektet…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Becsült bérezés (Ft, opcionális)</Label>
            <NumberInput
              value={budget}
              onChange={setBudget}
              placeholder="pl. 50 000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Küldés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
