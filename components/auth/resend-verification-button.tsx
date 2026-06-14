"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerVerificationEmail } from "@/app/actions/auth";

export function ResendVerificationButton() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await triggerVerificationEmail();
          if (res.error) {
            toast.error(res.error);
            return;
          }
          if (res.alreadyVerified) {
            toast.success("Az emailcímed már meg van erősítve — frissítsd az oldalt.");
            return;
          }
          toast.success("Új megerősítő emailt küldtünk.");
          setSent(true);
        })
      }
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {sent ? "Email újraküldve" : "Megerősítő email újraküldése"}
    </Button>
  );
}
