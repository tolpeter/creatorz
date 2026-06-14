"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Modul-szintű őr: csak teljes oldalbetöltésenként egyszer szól (belépéskor),
// nem minden admin-navigációnál. (Nincs browser storage.)
let lastKey = "";

/**
 * Belépéskori „push" értesítések az adminnak: olvasatlan kapcsolati üzenetek,
 * jóváhagyásra váró hirdetések és nyitott bejelentések.
 */
export function NewMessageToast({
  count = 0,
  pendingAds = 0,
  openReports = 0,
}: {
  count?: number;
  pendingAds?: number;
  openReports?: number;
}) {
  useEffect(() => {
    const key = `${count}|${pendingAds}|${openReports}`;
    if (key === lastKey) return;
    lastKey = key;

    if (count > 0) {
      toast.info(count === 1 ? "1 új kapcsolati üzenet" : `${count} új kapcsolati üzenet`, {
        description: "Nézd meg az Üzenetek menüben.",
      });
    }
    if (pendingAds > 0) {
      toast.warning(
        pendingAds === 1
          ? "1 hirdetés vár jóváhagyásra"
          : `${pendingAds} hirdetés vár jóváhagyásra`,
        { description: "Nézd meg a Hirdetések menüben." },
      );
    }
    if (openReports > 0) {
      toast.warning(
        openReports === 1 ? "1 új bejelentés" : `${openReports} új bejelentés`,
        { description: "Nézd meg a Bejelentések menüben." },
      );
    }
  }, [count, pendingAds, openReports]);
  return null;
}
