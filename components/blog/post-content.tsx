import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RichText } from "./rich-text";
import type { BlogBlock } from "@/lib/blog/types";

/** A blog blokk-tömb renderelése szép tipográfiával. */
export function PostContent({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-10 text-2xl font-black tracking-tight sm:text-3xl">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-6 text-xl font-bold">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="text-[15px] leading-7 text-foreground/80 sm:text-base sm:leading-8">
                <RichText text={b.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[15px] leading-7 text-foreground/80 sm:text-base">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>
                      <RichText text={it} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="space-y-2 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3 text-[15px] leading-7 text-foreground/80 sm:text-base">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0f4e5] text-xs font-bold text-[#3f6212]">
                      {j + 1}
                    </span>
                    <span>
                      <RichText text={it} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-accent bg-[#f6f7f2] px-5 py-4 text-lg font-medium italic leading-7">
                <RichText text={b.text} />
              </blockquote>
            );
          case "cta":
            return (
              <div key={i} className="my-6 flex flex-col items-start gap-3 rounded-2xl border border-accent/30 bg-[#f0f4e5] p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[#3f6212]">{b.text}</p>
                <Link
                  href={b.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-black hover:text-accent"
                >
                  {b.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
