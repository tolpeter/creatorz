"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveReport } from "@/app/actions/reports";
import { setUserSuspended } from "@/app/actions/admin";

export function ReportActions({
  reportId,
  reportedUserId,
}: {
  reportId: string;
  reportedUserId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, "resolved"), "Megoldottként lezárva")}
      >
        <Check className="h-4 w-4" /> Megoldva
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, "dismissed"), "Elvetve")}
      >
        <X className="h-4 w-4" /> Elvetés
      </Button>
      {reportedUserId && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Biztosan felfüggeszted ezt a felhasználót?")) return;
            run(async () => {
              const r = await setUserSuspended(reportedUserId, true);
              if (!r.error) await resolveReport(reportId, "resolved");
              return r;
            }, "Felhasználó felfüggesztve");
          }}
        >
          <Ban className="h-4 w-4" /> Felfüggesztés
        </Button>
      )}
    </div>
  );
}
