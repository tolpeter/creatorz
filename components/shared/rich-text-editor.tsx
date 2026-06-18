"use client";

import { useRef } from "react";
import { Bold, Italic, Heading, List, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Egyszerű, markdown-alapú szövegszerkesztő: a toolbar gombok markdown
 * jelölést szúrnak a kijelölés köré / elé. Az érték sima markdown szöveg,
 * amit a renderelésnél a `renderMarkdownToHtml` alakít biztonságos HTML-lé.
 */
export function RichTextEditor({
  value,
  onChange,
  maxLength,
  rows = 6,
  placeholder,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function surround(before: string, after: string = before) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "szöveg";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next.slice(0, maxLength ?? next.length));
    // a kijelölés visszaállítása a beszúrt szövegre
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function prefixLine(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next.slice(0, maxLength ?? next.length));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  const tools = [
    { icon: Bold, label: "Félkövér", onClick: () => surround("**") },
    { icon: Italic, label: "Dőlt", onClick: () => surround("*") },
    { icon: Heading, label: "Címsor", onClick: () => prefixLine("## ") },
    { icon: Type, label: "Alcím", onClick: () => prefixLine("### ") },
    { icon: List, label: "Lista", onClick: () => prefixLine("- ") },
  ];

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={t.onClick}
            className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="min-h-72 rounded-t-none border-0 focus-visible:ring-0"
      />
    </div>
  );
}
