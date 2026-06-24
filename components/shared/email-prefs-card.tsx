"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { updateEmailPrefs } from "@/app/actions/email-prefs";
import type { EmailPrefs } from "@/lib/email/prefs";

type CatKey = "messages" | "applications" | "collaborations" | "campaigns" | "reviews" | "newsletter";

const CATEGORIES: { key: CatKey; label: string; description: string }[] = [
  { key: "messages", label: "Új üzenet", description: "Ha valaki üzenetet ír neked." },
  { key: "applications", label: "Pályázatok", description: "Új pályázat, elfogadás/elutasítás, meghívás." },
  { key: "collaborations", label: "Együttműködések", description: "Leadás, jóváhagyás, lezárás, megállapodás." },
  { key: "campaigns", label: "Új kampányok és összefoglalók", description: "Hozzád illő új kampányok, heti összefoglaló." },
  { key: "reviews", label: "Értékelések", description: "Ha értékelést kapsz." },
  { key: "newsletter", label: "Hírlevél és tippek", description: "Újdonságok, tippek a Creatorz-tól." },
];

export function EmailPrefsCard({ initial }: { initial: EmailPrefs }) {
  const [pending, start] = useTransition();

  // null/hiányzó = bekapcsolva. all === false = minden kikapcsolva.
  const [emailsOn, setEmailsOn] = useState(initial.all !== false);
  const [cats, setCats] = useState<Record<CatKey, boolean>>({
    messages: initial.messages !== false,
    applications: initial.applications !== false,
    collaborations: initial.collaborations !== false,
    campaigns: initial.campaigns !== false,
    reviews: initial.reviews !== false,
    newsletter: initial.newsletter !== false,
  });

  function save() {
    start(async () => {
      const res = await updateEmailPrefs({ all: emailsOn, ...cats });
      if (res.error) toast.error(res.error);
      else toast.success("Email-beállítások mentve");
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold">Email-értesítések</h2>
          <p className="text-xs text-muted-foreground">
            Állítsd be, miről kapj emailt. A jelszó-visszaállítás és emailcím-megerősítés mindig megérkezik.
          </p>
        </div>
      </div>

      {/* Mester kapcsoló */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-background p-3.5">
        <div className="flex items-center gap-2">
          <BellOff className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Email-értesítések fogadása</p>
            <p className="text-xs text-muted-foreground">
              Kikapcsolva semmilyen értesítő emailt nem küldünk.
            </p>
          </div>
        </div>
        <Switch checked={emailsOn} onCheckedChange={setEmailsOn} disabled={pending} />
      </div>

      {/* Kategóriák */}
      <div className={cn("mt-3 space-y-2", !emailsOn && "pointer-events-none opacity-50")}>
        {CATEGORIES.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3.5"
          >
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </div>
            <Switch
              checked={emailsOn && cats[c.key]}
              onCheckedChange={(v) => setCats((prev) => ({ ...prev, [c.key]: v }))}
              disabled={pending || !emailsOn}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
          disabled={pending}
          onClick={save}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Mentés
        </Button>
      </div>
    </div>
  );
}
