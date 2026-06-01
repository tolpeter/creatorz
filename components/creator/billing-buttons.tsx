"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startCreatorSubscription,
  purchaseFeature,
  openCustomerPortal,
} from "@/app/actions/stripe";

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string } | undefined>) =>
    start(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
    });
  return { pending, run };
}

export function SubscribeButton({ label }: { label: string }) {
  const { pending, run } = useRun();
  return (
    <Button onClick={() => run(startCreatorSubscription)} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function PortalButton() {
  const { pending, run } = useRun();
  return (
    <Button variant="outline" onClick={() => run(openCustomerPortal)} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Előfizetés kezelése (Stripe)
    </Button>
  );
}

export function FeatureButton({
  type,
  label,
  primary,
}: {
  type: "7day" | "30day";
  label: string;
  primary?: boolean;
}) {
  const { pending, run } = useRun();
  return (
    <Button
      variant={primary ? "default" : "outline"}
      onClick={() => run(() => purchaseFeature(type))}
      disabled={pending}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
