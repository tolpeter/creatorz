"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  CheckCircle2,
  Building2,
  User,
  Handshake,
  Check,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_SUBJECTS } from "@/lib/constants";
import { sendContactMessage } from "@/app/actions/contact";

const TYPES = [
  { value: "Márka", title: "Márka vagyok", desc: "Márkaként érdeklődöm", icon: Building2 },
  { value: "Tartalomgyártó", title: "Tartalomgyártó vagyok", desc: "Alkotóként érdeklődöm", icon: User },
  { value: "Partner", title: "Együttműködés / Partnerkapcsolat", desc: "Partnerségről érdeklődöm", icon: Handshake },
] as const;

const MAX = 1000;
const inputCls =
  "h-11 border-white/15 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:ring-accent/60";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(CONTACT_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState("");
  const [type, setType] = useState<string>(TYPES[0].value);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isOther = subject === "Egyéb";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalSubject = isOther ? customSubject.trim() : subject;
    if (isOther && finalSubject.length < 2) {
      toast.error("Add meg az egyéb tárgyat");
      return;
    }
    const typeTitle = TYPES.find((t) => t.value === type)?.title ?? type;
    setLoading(true);
    const res = await sendContactMessage({
      name,
      email,
      subject: finalSubject,
      message: `Üzenet típus: ${typeTitle}\n\n${message}`,
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setSent(true);
    toast.success("Üzeneted elküldve! Hamarosan válaszolunk.");
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </span>
        <h3 className="mt-4 text-xl font-bold">Köszönjük az üzeneted!</h3>
        <p className="mt-1 text-sm text-white/60">
          Megkaptuk, és munkanapokon 24 órán belül válaszolunk a(z){" "}
          <strong className="text-white">{email}</strong> címre.
        </p>
        <Button
          variant="outline"
          className="mt-5 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={() => {
            setSent(false);
            setMessage("");
            setCustomSubject("");
          }}
        >
          Új üzenet írása
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-accent/25 bg-white/[0.05] p-5 text-white shadow-[0_0_90px_-20px_rgba(163,230,53,0.35)] ring-1 ring-accent/10 sm:p-8"
    >
      {/* Fejléc */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black">Üzenet küldése</h2>
          <p className="text-sm text-white/55">
            Írd le, miben segíthetünk! Minden üzenetre válaszolunk.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Név + email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">Neved *</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kovács Anna"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">Email cím *</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="te@pelda.hu"
              className={inputCls}
            />
          </div>
        </div>

        {/* Tárgy */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Tárgy *</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className={inputCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOther && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">Egyéb tárgy *</label>
            <Input
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Miről szeretnél írni?"
              className={inputCls}
            />
          </div>
        )}

        {/* Üzenet típus kártyák */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Üzenet típus</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={
                    "relative rounded-2xl border p-3 text-left transition-all " +
                    (active
                      ? "border-accent bg-accent/10 shadow-[0_0_24px_rgba(163,230,53,0.15)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25")
                  }
                >
                  {active && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-black">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <Icon className={active ? "h-5 w-5 text-accent" : "h-5 w-5 text-white/60"} />
                  <p className="mt-2 text-sm font-semibold leading-tight">{t.title}</p>
                  <p className="mt-0.5 text-xs text-white/45">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Üzenet */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Üzenet *</label>
          <div className="relative">
            <Textarea
              required
              rows={10}
              maxLength={MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Írd le, miben segíthetünk…"
              className="min-h-[240px] resize-y border-white/15 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:ring-accent/60"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-white/35">
              {message.length} / {MAX}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-accent text-base font-bold text-black shadow-[0_0_40px_rgba(163,230,53,0.35)] transition-all hover:bg-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Üzenet küldése
        </Button>
      </div>
    </form>
  );
}
