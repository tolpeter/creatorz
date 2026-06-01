"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptApplication, rejectApplication } from "@/app/actions/applications";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  async function accept() {
    setLoading("accept");
    const res = await acceptApplication(applicationId);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success("Pályázat elfogadva — együttműködés létrejött");
    router.refresh();
  }

  async function reject() {
    setLoading("reject");
    const res = await rejectApplication(applicationId);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success("Pályázat elutasítva");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={accept} disabled={loading !== null}>
        {loading === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Elfogadás
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={loading !== null}>
        {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        Elutasítás
      </Button>
    </div>
  );
}
