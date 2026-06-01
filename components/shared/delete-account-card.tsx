"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteOwnAccount } from "@/app/actions/account";

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await deleteOwnAccount(confirm);
    setLoading(false);
    if (res?.error) toast.error(res.error);
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Fiók törlése
        </CardTitle>
        <CardDescription>
          A fiókod 30 napon belül véglegesen törlődik. A profil azonnal eltűnik
          a publikus directoryból.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Fiók törlése</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Biztosan törlöd a fiókod?</DialogTitle>
              <DialogDescription>
                Ez a művelet visszavonhatatlan. Az adatok 30 napon belül véglegesen
                törlődnek.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Megerősítéshez írd be: „törlöm"</Label>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="destructive" disabled={loading} onClick={submit}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Végleges törlés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
