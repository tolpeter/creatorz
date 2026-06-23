"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { adminMessageUser } from "@/app/actions/messages";

/**
 * Admin → bármely felhasználó (márka vagy tartalomgyártó/kreatív) közvetlen
 * üzenet. A címzett vezérlőpultján beérkező üzenetként + értesítésként jelenik
 * meg (push + email is megy). "Creatorz csapat" néven érkezik.
 */
export function AdminMessageButton({
  toUserId,
  name,
  size = "sm",
  variant = "outline",
}: {
  toUserId: string;
  name: string;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (body.trim().length < 1) {
      toast.error("Írd be az üzenetet");
      return;
    }
    setLoading(true);
    const res = await adminMessageUser({ toUserId, body: body.trim() });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Üzenet elküldve: ${name}`);
    setBody("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Üzenet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Üzenet — {name}</DialogTitle>
          <DialogDescription>
            A címzett a vezérlőpultján kapja meg „Creatorz csapat" néven
            (értesítés + email is megy).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Írd ide az üzenetet…"
          autoFocus
        />
        <DialogFooter>
          <Button
            onClick={send}
            disabled={loading}
            className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Küldés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
