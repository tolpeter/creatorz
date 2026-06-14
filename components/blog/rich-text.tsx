import Link from "next/link";
import React from "react";

/**
 * Biztonságos inline renderelő: a szövegben lévő markdown linkeket
 * [címke](url) és félkövért **így** alakít React-node-okká.
 * Belső link (/-rel kezdődik) → next/link; külső → új lapon, rel-lel.
 * NEM injektál HTML-t, így nincs XSS-kockázat.
 */
const TOKEN = /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)/g;

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  const re = new RegExp(TOKEN);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("[")) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        const [, label, href] = lm;
        if (href.startsWith("/")) {
          parts.push(
            <Link key={key++} href={href} className="font-medium text-[#4d7c0f] underline underline-offset-2 hover:text-[#3f6212]">
              {label}
            </Link>,
          );
        } else {
          parts.push(
            <a
              key={key++}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#4d7c0f] underline underline-offset-2 hover:text-[#3f6212]"
            >
              {label}
            </a>,
          );
        }
      } else {
        parts.push(tok);
      }
    } else {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
