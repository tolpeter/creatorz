"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToUser } from "@/app/actions/messages";
import { uploadFile } from "@/lib/supabase/upload";

const MAX_MB = 25;

export function ReplyForm({ toUserId }: { toUserId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`A fájl túl nagy (max ${MAX_MB} MB).`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    const res = await uploadFile("messages", file);
    setUploading(false);
    e.target.value = "";
    if (res.error || !res.url) {
      toast.error(res.error ?? "Feltöltés sikertelen");
      return;
    }
    setAttachment({ url: res.url, name: file.name });
  }

  async function submit() {
    if (!body.trim() && !attachment) {
      toast.error("Írj választ vagy csatolj fájlt");
      return;
    }
    setLoading(true);
    const res = await replyToUser({
      toUserId,
      body,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
    });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Válasz elküldve");
    setBody("");
    setAttachment(null);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        rows={3}
        maxLength={5000}
        placeholder="Válasz írása…"
        onChange={(e) => setBody(e.target.value)}
      />

      {attachment && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs">
          <Paperclip className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Csatolmány eltávolítása"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={onPick} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || loading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          {uploading ? "Feltöltés…" : "Fájl"}
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={loading || uploading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Küldés
        </Button>
      </div>
    </div>
  );
}
