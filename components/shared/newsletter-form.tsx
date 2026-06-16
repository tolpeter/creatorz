"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Check } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

/**
 * Hírlevél-feliratkozás form — a láblécben és az app-popupban is használjuk.
 * Az adatok egy helyre (newsletter_subscribers) gyűjtődnek.
 *
 * variant:
 *   "footer" — világos háttéren (sötét szöveg)
 *   "dark"   — sötét háttéren (világos szöveg, pl. popup)
 */
export function NewsletterForm({
  source,
  variant = "footer",
  buttonLabel = "Feliratkozom",
}: {
  source: "footer" | "app_popup";
  variant?: "footer" | "dark";
  buttonLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await subscribeNewsletter({ email, source });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setDone(true);
    toast.success("Sikeres feliratkozás! Értesítünk a hírekről.");
  }

  if (done) {
    return (
      <p
        className={`flex items-center gap-2 text-sm font-semibold ${
          variant === "dark" ? "text-accent" : "text-[#3f6212]"
        }`}
      >
        <Check className="h-4 w-4" /> Köszönjük! Feliratkoztál a hírlevélre.
      </p>
    );
  }

  const dark = variant === "dark";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Mail
          className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? "text-white/50" : "text-muted-foreground"
          }`}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="te@email.hu"
          className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-accent ${
            dark
              ? "border-white/15 bg-white/10 text-white placeholder:text-white/40"
              : "border-black/15 bg-white text-foreground placeholder:text-muted-foreground"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-black transition hover:bg-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {buttonLabel}
      </button>
    </form>
  );
}
