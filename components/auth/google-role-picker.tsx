"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Camera, Building2, type LucideIcon } from "lucide-react";
import { completeSocialSignup } from "@/app/actions/auth";

type Choice = {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  input: { role: "creator" | "brand"; profileKind?: "ugc" | "professional"; creatorType?: "ugc" | "influencer" | "model" };
};

const CHOICES: Choice[] = [
  { key: "ugc", label: "UGC tartalomgyártó", desc: "Tartalmat készítesz a márkáknak.", icon: Sparkles, input: { role: "creator", profileKind: "ugc", creatorType: "ugc" } },
  { key: "influencer", label: "Influenszer", desc: "A saját csatornádon posztolsz.", icon: Sparkles, input: { role: "creator", profileKind: "ugc", creatorType: "influencer" } },
  { key: "model", label: "Modell", desc: "Termék- és divatfotózás, megjelenés.", icon: Sparkles, input: { role: "creator", profileKind: "ugc", creatorType: "model" } },
  { key: "professional", label: "Kreatív szakember", desc: "Fotós, operatőr, videóvágó.", icon: Camera, input: { role: "creator", profileKind: "professional" } },
  { key: "brand", label: "Márka / cég", desc: "Kampányt adsz fel, alkotókat keresel.", icon: Building2, input: { role: "brand" } },
];

export function GoogleRolePicker() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function pick(c: Choice) {
    setBusy(c.key);
    start(async () => {
      const res = await completeSocialSignup(c.input);
      if (res.error) {
        setBusy(null);
        toast.error(res.error);
        return;
      }
      if (res.redirectTo) router.push(res.redirectTo);
    });
  }

  return (
    <div className="space-y-3">
      {CHOICES.map((c) => {
        const Icon = c.icon;
        const loading = pending && busy === c.key;
        return (
          <button
            key={c.key}
            type="button"
            disabled={pending}
            onClick={() => pick(c)}
            className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md disabled:opacity-60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f4e5] text-[#3f6212]">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{c.label}</span>
              <span className="block text-sm text-muted-foreground">{c.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
