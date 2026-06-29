"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { completeSocialSignup } from "@/app/actions/auth";

/**
 * Ha a Google-belépés már hozta a kiválasztott szerepkört, itt automatikusan
 * létrehozzuk a fiókot (a szerepkör-választó kihagyásával) és onboardingra viszünk.
 */
export function GoogleAutoComplete({
  role,
  profileKind,
  creatorType,
}: {
  role: "creator" | "brand";
  profileKind?: "ugc" | "professional";
  creatorType?: "ugc" | "influencer" | "model";
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const res = await completeSocialSignup({ role, profileKind, creatorType });
      if (res.error || !res.redirectTo) {
        toast.error(res.error ?? "Hiba a fiók létrehozásánál.");
        router.replace("/regisztracio-google"); // essünk vissza a választóra
        return;
      }
      router.replace(res.redirectTo);
    })();
  }, [role, profileKind, creatorType, router]);

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
      <p className="text-sm text-muted-foreground">Fiókod létrehozása folyamatban…</p>
    </div>
  );
}
