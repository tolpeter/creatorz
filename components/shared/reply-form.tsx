"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToUser } from "@/app/actions/messages";

export function ReplyForm({ toUserId }: { toUserId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim()) {
      toast.error("Írd meg a választ");
      return;
    }
    setLoading(true);
    const res = await replyToUser({ toUserId, body });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Válasz elküldve");
    setBody("");
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
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Küldés
        </Button>
      </div>
    </div>
  );
}
