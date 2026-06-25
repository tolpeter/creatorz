"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Handshake } from "lucide-react";
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
import { requestCreatorProject } from "@/app/actions/creator-projects";

/**
 * „Közös munkára felkérés" — egy alkotó (pl. fotós/operatőr) közvetlenül,
 * márka nélkül hív közös munkára egy másik alkotót (pl. modellt/influenszert).
 */
export function CreatorProjectButton({
  partnerUsername,
  partnerName,
}: {
  partnerUsername: string;
  partnerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (title.trim().length < 3) {
      toast.error("Adj egy rövid címet a projektnek (min. 3 karakter)");
      return;
    }
    setLoading(true);
    const res = await requestCreatorProject({ partnerUsername, title, note });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Felkérés elküldve! A beszélgetés megnyílt az Üzenetekben.");
    setOpen(false);
    setTitle("");
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl bg-accent px-5 text-sm font-black text-black hover:bg-accent/90 sm:h-12 sm:px-7 sm:text-base">
          <Handshake className="h-5 w-5" /> Közös munkára felkérés
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Közös munka — {partnerName}</DialogTitle>
          <DialogDescription>
            Hívd közös munkára (pl. fotózás, forgatás) — márka nélkül is. A felkéréssel
            megnyílik a beszélgetés, és {partnerName} értesítést kap.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Projekt címe</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="pl. Közös portfólió-fotózás Budapesten"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Részletek (opcionális)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Mit, hol, mikor — pár mondat a közös munkáról…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Felkérés küldése
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
