"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party "idő az oldalon" mérés. Oldalváltáskor és tab-elhagyáskor
 * elküldi az aktuális oldalon eltöltött időt a /api/track végpontnak
 * (sendBeacon). A munkamenet-azonosítót egy 30 perces session cookie tartja
 * (NEM localStorage). A háttérben töltött időt nem számolja.
 */
function getSessionId(): string {
  const m = document.cookie.match(/(?:^|;\s*)cz_sid=([^;]+)/);
  let sid = m?.[1];
  if (!sid) {
    sid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  // Sliding 30 perc — minden aktivitásnál megújul.
  document.cookie = `cz_sid=${sid}; path=/; max-age=1800; samesite=lax`;
  return sid;
}

export function PageTimeTracker() {
  const pathname = usePathname();
  const start = useRef<number>(0);
  const pathRef = useRef<string>("");

  function send() {
    if (!pathRef.current || !start.current) return;
    const dur = performance.now() - start.current;
    if (dur < 1000) return;
    try {
      const body = JSON.stringify({
        sessionId: getSessionId(),
        path: pathRef.current,
        durationMs: Math.round(dur),
      });
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon || !navigator.sendBeacon("/api/track", blob)) {
        void fetch("/api/track", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* némán */
    }
  }

  // Oldalváltás: előbb az előző oldal idejét küldjük, majd új mérés indul.
  useEffect(() => {
    send();
    pathRef.current = pathname;
    start.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Tab-elrejtés / oldal-elhagyás: küldés + a háttéridő kihagyása.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        send();
      } else {
        start.current = performance.now();
      }
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", send);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", send);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
