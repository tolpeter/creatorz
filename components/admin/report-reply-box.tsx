"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminMessageUser } from "@/app/actions/messages";

/**
 * Admin válasz egy bejelentőnek — a Creatorz csapat nevében, ami a bejelentő
 * ÜZENETEI közé kerül (messages tábla + értesítés + push + email).
 */
export function ReportReplyBox({
  reporterUserId,
  reporterEmail,
}: {
  reporterUserId: string | null;
  reporterEmail: string | null;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!reporterUserId) {
    return (
      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        Névtelen bejelentő — üzenetben nem küldhető válasz
        {reporterEmail ? ` (email: ${reporterEmail})` : ""}.
      </p>
    );
  }

  async function send() {
    if (!reporterUserId) return;
    if (!body.trim()) {
      toast.error("Írd be a választ");
      return;
    }
    setSending(true);
    const res = await adminMessageUser({ toUserId: reporterUserId, body: body.trim() });
    setSending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Válasz elküldve a bejelentő üzenetei közé");
    setBody("");
    setSent(true);
  }

  return (
    <div className="mt-3 border-t pt-3">
      {sent ? (
        <p className="text-xs font-medium text-green-700">
          Válasz elküldve ✓{" "}
          <button
            type="button"
            className="ml-1 underline hover:no-underline"
            onClick={() => setSent(false)}
          >
            Új válasz írása
          </button>
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Válasz a bejelentőnek (a „Creatorz csapat" nevében, az üzenetei közé kerül):
          </p>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="pl. Köszönjük a jelzést, kivizsgáltuk és intézkedtünk…"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={send} disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? "Küldés…" : "Válasz küldése"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
