"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminMessageCreator } from "@/app/actions/messages";

/**
 * Admin → tartalomgyártó közvetlen üzenet indítása felhasználónév alapján.
 * (A creator publikus profil-linkje: /creators/<felhasznalonev>.)
 */
export function AdminComposeMessage({ presetUsername = "" }: { presetUsername?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(presetUsername);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!username.trim()) return toast.error("Add meg a tartalomgyártó felhasználónevét");
    if (body.trim().length < 1) return toast.error("Írd be az üzenetet");
    setLoading(true);
    const res = await adminMessageCreator({ toUsername: username.trim(), body });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Üzenet elküldve");
    setBody("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Új üzenet tartalomgyártónak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Felhasználónév</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pl. kovacs-anna (a profil-link vége)"
          />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Üzenet a tartalomgyártónak…"
        />
        <div className="flex justify-end">
          <Button
            onClick={send}
            disabled={loading}
            className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Küldés
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
