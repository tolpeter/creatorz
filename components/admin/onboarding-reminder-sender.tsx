"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sendOnboardingReminderBatch,
  sendOnboardingReminderTest,
} from "@/app/actions/campaigns";

const BATCH = 25;

export function OnboardingReminderSender({
  eligible,
  sent,
  remaining,
}: {
  eligible: number;
  sent: number;
  remaining: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"test" | "batch" | null>(null);

  function runTest() {
    setBusy("test");
    start(async () => {
      const res = await sendOnboardingReminderTest();
      setBusy(null);
      if (res.error) toast.error(res.error);
      else toast.success(`Teszt-email elküldve: ${res.to}`);
    });
  }

  function runBatch() {
    setBusy("batch");
    start(async () => {
      const res = await sendOnboardingReminderBatch(BATCH);
      setBusy(null);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          `Kiküldve: ${res.sent}${res.failed ? `, hiba: ${res.failed}` : ""}. Hátralévő: ${res.remaining}`,
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold">Befejezetlen regisztráció — emlékeztető</p>
          <p className="text-xs text-muted-foreground">
            Akik elkezdték, de nem fejezték be a regisztrációt. A küldés a szerveren fut (éles Resend-kulcs).
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-background p-3 text-center">
          <p className="text-2xl font-black text-[#3f6212]">{eligible}</p>
          <p className="text-[11px] text-muted-foreground">befejezetlen</p>
        </div>
        <div className="rounded-xl border bg-background p-3 text-center">
          <p className="text-2xl font-black text-[#3f6212]">{sent}</p>
          <p className="text-[11px] text-muted-foreground">már megkapta</p>
        </div>
        <div className="rounded-xl border bg-background p-3 text-center">
          <p className="text-2xl font-black text-[#3f6212]">{remaining}</p>
          <p className="text-[11px] text-muted-foreground">még küldendő</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={runTest}>
          {pending && busy === "test" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Teszt magamnak
        </Button>
        <Button
          size="sm"
          className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
          disabled={pending || remaining === 0}
          onClick={runBatch}
        >
          {pending && busy === "batch" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {remaining === 0 ? "Mindenki megkapta" : `Küldés (következő ${Math.min(BATCH, remaining)})`}
        </Button>
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground">
            Kattints többször, amíg a „még küldendő" 0 nem lesz.
          </span>
        )}
      </div>
    </div>
  );
}
