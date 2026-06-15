"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  RotateCcw,
  Trash2,
  Loader2,
  Reply,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  setContactRead,
  deleteContactMessage,
  replyToContactMessage,
} from "@/app/actions/contact";

export function ContactMessageActions({
  id,
  read,
  replied,
}: {
  id: string;
  read: boolean;
  replied: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | "reply" | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  async function toggleRead() {
    setLoading("toggle");
    const res = await setContactRead(id, !read);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success(read ? "Olvasatlanra állítva" : "Olvasottnak jelölve");
    router.refresh();
  }

  async function remove() {
    setLoading("delete");
    const res = await deleteContactMessage(id);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success("Üzenet törölve");
    router.refresh();
  }

  async function sendReply() {
    if (body.trim().length < 2) return toast.error("Írd be a választ");
    setLoading("reply");
    const res = await replyToContactMessage({ id, body });
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success("Válasz elküldve a feladó email-címére");
    setBody("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        <Button
          type="button"
          variant={open ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen((v) => !v)}
          disabled={!!loading}
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Reply className="h-3.5 w-3.5" />}
          {open ? "Mégse" : "Válasz"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleRead}
          disabled={!!loading}
        >
          {loading === "toggle" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : read ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {read ? "Olvasatlan" : "Olvasott"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={!!loading}
        >
          {loading === "delete" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {open && (
        <div className="w-full rounded-xl border border-accent/40 bg-accent/[0.04] p-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Írd ide a választ — branded emailben megy a feladó címére…"
            className="resize-y bg-white"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {replied ? "Erre az üzenetre már válaszoltál — új válasz is küldhető." : "A válasz a feladó email-címére megy."}
            </span>
            <Button
              type="button"
              size="sm"
              className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
              onClick={sendReply}
              disabled={loading === "reply"}
            >
              {loading === "reply" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Válasz küldése
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
