"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Heading, List, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMarkdownToHtml } from "@/lib/utils/markdown";

/**
 * WYSIWYG szövegszerkesztő: a toolbar gombok AZONNAL formázzák a kijelölést
 * (félkövér/dőlt/címsor/lista) — a felhasználó rögtön a kész formázást látja,
 * nem markdown-jelölést. Kifelé (onChange) viszont továbbra is BIZTONSÁGOS
 * markdownt adunk, amit a `renderMarkdownToHtml` XSS-mentesen jelenít meg.
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
  const ref = useRef<HTMLDivElement>(null);
  // Az utoljára kifelé adott markdown — hogy ne írjuk felül a kurzort gépelés
  // közben, csak külső érték-változáskor szinkronizáljunk.
  const lastMd = useRef<string>("");

  // Kezdeti / külső érték → formázott HTML a szerkesztőbe.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastMd.current) {
      el.innerHTML = renderMarkdownToHtml(value || "");
      lastMd.current = value || "";
    }
  }, [value]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    let md = htmlToMarkdown(el);
    if (maxLength && md.length > maxLength) md = md.slice(0, maxLength);
    lastMd.current = md;
    onChange(md);
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  const tools = [
    { icon: Bold, label: "Félkövér", run: () => exec("bold") },
    { icon: Italic, label: "Dőlt", run: () => exec("italic") },
    { icon: Heading, label: "Címsor", run: () => exec("formatBlock", "H3") },
    { icon: Type, label: "Alcím", run: () => exec("formatBlock", "H4") },
    { icon: List, label: "Lista", run: () => exec("insertUnorderedList") },
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
            // A kijelölés megőrzése: ne veszítse el a fókuszt a gomb lenyomásakor.
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        style={{ minHeight: `${Math.max(rows, 6) * 1.6}rem` }}
        className="rte-content prose prose-sm max-w-none px-3 py-2 text-sm leading-6 outline-none [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-bold [&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-bold [&_em]:italic"
      />
    </div>
  );
}

/**
 * A contentEditable HTML-jét visszaalakítja a támogatott markdown-részhalmazra
 * (strong/em → ** / *, h1-6 → ## / ###, ul/li → "- ", bekezdések üres sorral).
 */
function htmlToMarkdown(root: HTMLElement): string {
  const inlineText = (node: Node): string => {
    let s = "";
    node.childNodes.forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) {
        s += c.textContent ?? "";
      } else if (c.nodeType === Node.ELEMENT_NODE) {
        const el = c as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const inner = inlineText(el);
        if (tag === "strong" || tag === "b") s += inner.trim() ? `**${inner}**` : "";
        else if (tag === "em" || tag === "i") s += inner.trim() ? `*${inner}*` : "";
        else if (tag === "br") s += "\n";
        else s += inner;
      }
    });
    return s;
  };

  const blocks: string[] = [];
  root.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) {
      const t = (c.textContent ?? "").trim();
      if (t) blocks.push(t);
      return;
    }
    if (c.nodeType !== Node.ELEMENT_NODE) return;
    const el = c as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li) => `- ${inlineText(li).trim()}`)
        .filter((l) => l !== "- ");
      if (items.length) blocks.push(items.join("\n"));
    } else if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const prefix = level <= 3 ? "## " : "### ";
      const txt = inlineText(el).trim();
      if (txt) blocks.push(prefix + txt);
    } else {
      // p / div / egyéb blokk → bekezdés
      const txt = inlineText(el).replace(/\n+$/, "").trim();
      if (txt) blocks.push(txt);
    }
  });

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
