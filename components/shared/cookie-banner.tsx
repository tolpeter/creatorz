"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("creatorz_cookie_consent")) setShow(true);
  }, []);

  function set(value: "accepted" | "rejected") {
    document.cookie = `creatorz_cookie_consent=${value}; max-age=31536000; path=/; samesite=lax`;
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Sütiket használunk az élmény javításához és statisztikai célokra. A
          használathoz a beleegyezésed szükséges.{" "}
          <Link href="/cookies" className="underline">
            Részletek
          </Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => set("rejected")}>
            Elutasítás
          </Button>
          <Button size="sm" onClick={() => set("accepted")}>
            Elfogadom
          </Button>
        </div>
      </div>
    </div>
  );
}
