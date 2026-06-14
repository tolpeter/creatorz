import "server-only";

/**
 * Egységes branded email-layout. Minden tranzakciós + marketing emailünk
 * ezen keresztül készül — így a fejléc, lábléc, gombok mindenhol konzisztensek.
 *
 * Színek a marketing-oldal radix-nova / lime brandhez illeszkednek:
 *   - Háttér: #f6f7f2 (krém)
 *   - Card: #ffffff
 *   - Headline szín: #0a0a0a
 *   - Accent (CTA): #84cc16 → #65a30d hover (statikus emailben sima 84cc16)
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
const SUPPORT_EMAIL = process.env.ADMIN_EMAIL || "info@creatorz.hu";

export type EmailLayoutInput = {
  /** Preheader: a postaládában a tárgy után megjelenő rövid előnézet */
  preheader?: string;
  /** A fő H1 az emailben (max 60 karakter ajánlott) */
  heading: string;
  /** Köszöntő mondat, pl. "Szia Anna!" */
  greeting?: string;
  /** A heading alatti bevezető paragrafus (HTML megengedett) */
  intro?: string;
  /** Opcionális CTA gomb */
  cta?: { label: string; href: string };
  /** Tetszőleges body-HTML a CTA alá (pl. lista, kártya) */
  bodyHtml?: string;
  /** Lábléci kiegészítő szöveg (pl. "Ez a link 24 órán át érvényes.") */
  footnote?: string;
};

export function renderBrandedEmail(input: EmailLayoutInput): string {
  const {
    preheader,
    heading,
    greeting,
    intro,
    cta,
    bodyHtml,
    footnote,
  } = input;

  const safePreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(
        preheader,
      )}</div>`
    : "";

  const greetingHtml = greeting
    ? `<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#0a0a0a;font-weight:600;">${escapeHtml(greeting)}</p>`
    : "";

  const introHtml = intro
    ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#3f3f46;">${intro}</p>`
    : "";

  const ctaHtml = cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
        <tr>
          <td align="center" bgcolor="#84cc16"
              style="border-radius:9999px;background:#84cc16;">
            <a href="${escapeAttr(cta.href)}"
               style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:800;color:#0a0a0a;text-decoration:none;border-radius:9999px;">
              ${escapeHtml(cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const bodyExtraHtml = bodyHtml
    ? `<div style="margin:8px 0 24px;font-size:14px;line-height:1.7;color:#3f3f46;">${bodyHtml}</div>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#71717a;">${escapeHtml(footnote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
${safePreheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f7f2;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="padding:0 4px 18px;" align="left">
            <a href="${escapeAttr(APP_URL)}"
               style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:900;color:#0a0a0a;text-decoration:none;letter-spacing:-0.5px;">
              creator<span style="color:#84cc16;">z</span>
            </a>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:18px;border:1px solid #e7e7e2;padding:32px 30px;">
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#0a0a0a;font-weight:900;letter-spacing:-0.3px;">
              ${escapeHtml(heading)}
            </h1>
            ${greetingHtml}
            ${introHtml}
            ${ctaHtml}
            ${bodyExtraHtml}
            ${footnoteHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:22px 6px 0;" align="center">
            <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#71717a;">
              Creatorz.hu &middot; A magyar UGC tartalomgyártók közössége
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
              Kérdésed van? Írj nekünk:
              <a href="mailto:${escapeAttr(SUPPORT_EMAIL)}" style="color:#4d7c0f;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
