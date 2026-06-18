/**
 * Pici, BIZTONSÁGOS markdown-részhalmaz renderelő a hirdetésleírásokhoz.
 * A bemenetet ELŐSZÖR teljesen HTML-escape-eljük, és UTÁNA illesztünk be
 * kizárólag saját, ismert tageket (strong/em/h3/h4/ul/li/br) — így nincs
 * mód tetszőleges HTML/JS injektálásra (XSS-mentes).
 *
 * Támogatott jelölés:
 *  - **félkövér**            → <strong>
 *  - *dőlt* vagy _dőlt_      → <em>
 *  - ## Nagy címsor          → <h3>
 *  - ### Kisebb címsor       → <h4>
 *  - "- " kezdetű sorok      → <ul><li>
 *  - üres sor                → bekezdés-elválasztó
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(escaped: string): string {
  return escaped
    // **félkövér** (a dőlt előtt, hogy ne ütközzenek)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    // *dőlt*
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    // _dőlt_
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
}

export function renderMarkdownToHtml(input: string): string {
  const escaped = escapeHtml(input ?? "");
  const lines = escaped.split(/\r?\n/);

  const out: string[] = [];
  let listOpen = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${inline(paragraph.join("<br/>"))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<h4>${inline(line.replace(/^###\s+/, ""))}</h4>`);
    } else if (/^##\s+/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<h3>${inline(line.replace(/^##\s+/, ""))}</h3>`);
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      flushParagraph();
      closeList();
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  closeList();
  return out.join("");
}

/** Sima szöveg markdown-jelölések nélkül (meta description, előnézet). */
export function stripMarkdown(input: string): string {
  return (input ?? "")
    .replace(/[#*_>`]/g, "")
    .replace(/^\s*[-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
