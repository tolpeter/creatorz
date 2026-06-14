import "server-only";
import { renderBrandedEmail } from "./layout";

/**
 * Magas szintű email-template-ek a teljes alkalmazás számára. Minden tranzakciós
 * email innen jön — így a hangnem és a vizuál mindenhol konzisztens.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

// ──────────────────────────────────────────────────────────────────────────
// REGISZTRÁCIÓ — emailcím-megerősítés
// ──────────────────────────────────────────────────────────────────────────
export function renderVerificationEmail(input: {
  name: string;
  verifyUrl: string;
  hoursValid: number;
}): { subject: string; html: string } {
  return {
    subject: "Erősítsd meg az emailcímed — Creatorz",
    html: renderBrandedEmail({
      preheader: "Egy utolsó kattintás, és élesítjük a fiókodat.",
      heading: "Aktiváld a fiókod",
      greeting: `Szia ${input.name}!`,
      intro:
        "Köszönjük, hogy regisztráltál a <strong>Creatorz</strong>-ra. Egyetlen lépés van hátra: erősítsd meg az emailcímedet az alábbi gombbal, és élesítjük a profilod.",
      cta: { label: "Emailcím megerősítése", href: input.verifyUrl },
      bodyHtml: `
        <p style="margin:0 0 6px;">Vagy másold be ezt a linket a böngésződbe:</p>
        <p style="margin:0;word-break:break-all;"><a href="${input.verifyUrl}" style="color:#4d7c0f;">${input.verifyUrl}</a></p>
      `,
      footnote: `Ez a link ${input.hoursValid} órán át érvényes. Ha nem te regisztráltál, hagyd figyelmen kívül ezt az emailt.`,
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// JELSZÓ-VISSZAÁLLÍTÁS (Supabase Auth-hoz — ezt az HTML-t kell beilleszteni
// a Supabase Dashboard → Authentication → Email Templates → Reset Password)
// A {{ .ConfirmationURL }} változót a Supabase tölti ki.
// ──────────────────────────────────────────────────────────────────────────
export function renderPasswordResetEmailForSupabase(): string {
  return renderBrandedEmail({
    preheader: "Új jelszó beállítása a Creatorz fiókodhoz.",
    heading: "Új jelszó beállítása",
    intro:
      "Jelszó-visszaállítást kértél a Creatorz fiókodhoz. Kattints az alábbi gombra, és állíts be új jelszót.",
    cta: { label: "Új jelszó beállítása", href: "{{ .ConfirmationURL }}" },
    bodyHtml: `
      <p style="margin:0 0 6px;">Vagy másold be ezt a linket a böngésződbe:</p>
      <p style="margin:0;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#4d7c0f;">{{ .ConfirmationURL }}</a></p>
    `,
    footnote:
      "Ha nem te kérted a jelszó-visszaállítást, hagyd figyelmen kívül ezt az emailt — a fiókod biztonságban van.",
  });
}

// Ugyanez a Supabase „Confirm signup" template-hez (ha valaha vissza akarunk
// térni a Supabase saját regisztráció-megerősítésére):
export function renderSupabaseConfirmEmail(): string {
  return renderBrandedEmail({
    preheader: "Aktiváld a fiókod a Creatorz-on.",
    heading: "Aktiváld a fiókod",
    intro:
      "Köszönjük, hogy regisztráltál a Creatorz-ra. Erősítsd meg az emailcímedet, és élesítjük a profilod.",
    cta: { label: "Emailcím megerősítése", href: "{{ .ConfirmationURL }}" },
    footnote: "Ha nem te regisztráltál, hagyd figyelmen kívül ezt az emailt.",
  });
}

// ──────────────────────────────────────────────────────────────────────────
// PÁLYÁZAT — új pályázat (márkának)
// ──────────────────────────────────────────────────────────────────────────
export function renderNewApplicationEmail(input: {
  creatorName: string;
  adTitle: string;
}): { subject: string; html: string } {
  return {
    subject: `Új pályázat — ${input.adTitle}`,
    html: renderBrandedEmail({
      preheader: `${input.creatorName} jelentkezett a hirdetésedre.`,
      heading: "Új pályázat érkezett",
      intro: `<strong>${escapeHtml(input.creatorName)}</strong> pályázott a(z) „<strong>${escapeHtml(input.adTitle)}</strong>" hirdetésedre.`,
      cta: { label: "Pályázat megnyitása", href: `${APP_URL}/brand/ads` },
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// PÁLYÁZAT — elfogadva (tartalomgyártónak)
// ──────────────────────────────────────────────────────────────────────────
export function renderApplicationAcceptedEmail(input: {
  creatorName: string;
  brandName: string;
  adTitle: string;
}): { subject: string; html: string } {
  return {
    subject: "Elfogadták a pályázatodat — Creatorz",
    html: renderBrandedEmail({
      preheader: `${input.brandName} kiválasztott a(z) „${input.adTitle}" projektre.`,
      heading: "Elfogadták a pályázatodat",
      greeting: `Szia ${input.creatorName}!`,
      intro: `A(z) <strong>${escapeHtml(input.brandName)}</strong> elfogadta a pályázatodat a következő projektre:<br><br><strong>„${escapeHtml(input.adTitle)}"</strong>`,
      cta: { label: "Részletek megnyitása", href: `${APP_URL}/creator/applications` },
      footnote: "A márka hamarosan felveszi veled a kapcsolatot az üzenetekben.",
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// PÁLYÁZAT — elutasítva (tartalomgyártónak)
// ──────────────────────────────────────────────────────────────────────────
export function renderApplicationRejectedEmail(input: {
  creatorName: string;
  adTitle: string;
  reason?: string;
}): { subject: string; html: string } {
  return {
    subject: "Pályázatod elbírálva — Creatorz",
    html: renderBrandedEmail({
      preheader: "Sajnos ezúttal nem téged választottak — nézz szét a többi briefen.",
      heading: "Pályázatod elbírálva",
      greeting: `Szia ${input.creatorName}!`,
      intro: `A(z) „<strong>${escapeHtml(input.adTitle)}</strong>" hirdetésre adott pályázatodat ezúttal nem fogadták el.`,
      bodyHtml: input.reason
        ? `<p style="margin:0 0 10px;"><strong>Indok:</strong> ${escapeHtml(input.reason)}</p>`
        : "",
      cta: { label: "Új hirdetések böngészése", href: `${APP_URL}/ads` },
      footnote: "Folyamatosan érkeznek új projektek — érdemes visszanézni.",
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// ÚJ ÜZENET (creator vagy brand)
// ──────────────────────────────────────────────────────────────────────────
export function renderNewMessageEmail(input: {
  recipientName: string;
  senderName: string;
  preview?: string;
  inboxUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Új üzenet a Creatorz-on — ${input.senderName}`,
    html: renderBrandedEmail({
      preheader: `${input.senderName} írt neked a Creatorz-on.`,
      heading: "Új üzeneted érkezett",
      greeting: `Szia ${input.recipientName}!`,
      intro: `<strong>${escapeHtml(input.senderName)}</strong> üzenetet küldött neked a Creatorz-on.`,
      bodyHtml: input.preview
        ? `<blockquote style="margin:8px 0;padding:12px 16px;border-left:3px solid #84cc16;background:#f6f7f2;border-radius:6px;color:#3f3f46;font-style:italic;">${escapeHtml(input.preview)}</blockquote>`
        : "",
      cta: { label: "Üzenet megnyitása", href: input.inboxUrl },
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// HÍRLEVÉL — általános marketing template (admin küldi tömegesen)
// ──────────────────────────────────────────────────────────────────────────
export function renderNewsletterEmail(input: {
  subject: string;
  preheader?: string;
  heading: string;
  intro?: string;
  bodyHtml?: string;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const footer = input.unsubscribeUrl
    ? `Nem szeretnél több ilyen emailt? <a href="${input.unsubscribeUrl}" style="color:#71717a;">Iratkozz le itt.</a>`
    : undefined;

  return {
    subject: input.subject,
    html: renderBrandedEmail({
      preheader: input.preheader ?? input.heading,
      heading: input.heading,
      intro: input.intro,
      cta: input.cta,
      bodyHtml: input.bodyHtml,
      footnote: footer,
    }),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
