import "server-only";
import { renderBrandedEmail } from "./layout";
import { supabaseOgImage } from "@/lib/utils/og-image";

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
// JELSZÓ-VISSZAÁLLÍTÁS (saját Resend-es rendszer — branded, magyar email)
// ──────────────────────────────────────────────────────────────────────────
export function renderPasswordResetEmail(input: {
  name?: string;
  resetUrl: string;
  hoursValid: number;
}): { subject: string; html: string } {
  return {
    subject: "Jelszó visszaállítása — Creatorz",
    html: renderBrandedEmail({
      preheader: "Állíts be új jelszót a Creatorz fiókodhoz.",
      heading: "Új jelszó beállítása",
      greeting: input.name ? `Szia ${input.name}!` : "Szia!",
      intro:
        "Jelszó-visszaállítást kértél a <strong>Creatorz</strong> fiókodhoz. Kattints az alábbi gombra, és állíts be egy új jelszót.",
      cta: { label: "Új jelszó beállítása", href: input.resetUrl },
      bodyHtml: `
        <p style="margin:0 0 6px;">Vagy másold be ezt a linket a böngésződbe:</p>
        <p style="margin:0;word-break:break-all;"><a href="${input.resetUrl}" style="color:#4d7c0f;">${input.resetUrl}</a></p>
      `,
      footnote: `Ez a link ${input.hoursValid} órán át érvényes. Ha nem te kérted a jelszó-visszaállítást, hagyd figyelmen kívül ezt az emailt — a fiókod biztonságban van.`,
    }),
  };
}

// (Megtartva: a Supabase saját email-template-jéhez, ha valaha visszatérnénk rá.)
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
  creatorUsername: string;
  creatorAvatarUrl?: string | null;
  adTitle: string;
  messagePreview?: string;
}): { subject: string; html: string } {
  const profileUrl = `${APP_URL}/creators/${input.creatorUsername}`;
  const avatar = input.creatorAvatarUrl
    ? supabaseOgImage(input.creatorAvatarUrl, { width: 120, height: 120, resize: "cover" })
    : null;
  const initial = escapeHtml(input.creatorName.charAt(0).toUpperCase() || "?");

  // E-mail-biztos (táblás, inline) pályázó-kártya: profilkép + név + profil-link.
  const avatarCell = avatar
    ? `<img src="${avatar}" width="60" height="60" alt="${escapeHtml(input.creatorName)}" style="display:block;width:60px;height:60px;border-radius:30px;object-fit:cover;border:2px solid #84cc16;" />`
    : `<div style="width:60px;height:60px;border-radius:30px;background:#84cc16;color:#0a0a0a;font-weight:800;font-size:24px;line-height:60px;text-align:center;">${initial}</div>`;

  const applicantCard = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
      <tr>
        <td style="vertical-align:middle;padding-right:14px;">${avatarCell}</td>
        <td style="vertical-align:middle;">
          <div style="font-weight:700;font-size:16px;color:#18181b;">${escapeHtml(input.creatorName)}</div>
          <a href="${profileUrl}" style="color:#4d7c0f;font-size:14px;font-weight:600;text-decoration:underline;">Profil megtekintése →</a>
        </td>
      </tr>
    </table>
    ${
      input.messagePreview
        ? `<blockquote style="margin:0 0 6px;padding:12px 16px;border-left:3px solid #84cc16;background:#f6f7f2;border-radius:6px;color:#3f3f46;font-style:italic;">${escapeHtml(input.messagePreview)}</blockquote>`
        : ""
    }
  `;

  return {
    subject: `Új pályázat — ${input.adTitle}`,
    html: renderBrandedEmail({
      preheader: `${input.creatorName} jelentkezett a kampányodra.`,
      heading: "Új pályázat érkezett",
      intro: `<strong>${escapeHtml(input.creatorName)}</strong> pályázott a(z) „<strong>${escapeHtml(input.adTitle)}</strong>" kampányodra.`,
      bodyHtml: applicantCard,
      cta: { label: "Pályázat megnyitása", href: `${APP_URL}/brand/applications` },
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
      intro: `A(z) „<strong>${escapeHtml(input.adTitle)}</strong>" kampányra adott pályázatodat ezúttal nem fogadták el.`,
      bodyHtml: input.reason
        ? `<p style="margin:0 0 10px;"><strong>Indok:</strong> ${escapeHtml(input.reason)}</p>`
        : "",
      cta: { label: "Új kampányok böngészése", href: `${APP_URL}/ads` },
      footnote: "Folyamatosan érkeznek új projektek — érdemes visszanézni.",
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// MEGHÍVÁS HIRDETÉSRE (márka → tartalomgyártó)
// ──────────────────────────────────────────────────────────────────────────
export function renderAdInvitationEmail(input: {
  creatorName: string;
  brandName: string;
  adTitle: string;
  adUrl: string;
  message?: string;
}): { subject: string; html: string } {
  return {
    subject: `Meghívást kaptál egy kampányra — ${input.brandName}`,
    html: renderBrandedEmail({
      preheader: `${input.brandName} szeretne együtt dolgozni veled a(z) „${input.adTitle}" projekten.`,
      heading: "Meghívást kaptál egy kampányra",
      greeting: `Szia ${input.creatorName}!`,
      intro: `A(z) <strong>${escapeHtml(input.brandName)}</strong> kifejezetten téged hívott meg, hogy pályázz a következő kampányára:<br><br><strong>„${escapeHtml(input.adTitle)}"</strong>`,
      bodyHtml: input.message
        ? `<blockquote style="margin:8px 0;padding:12px 16px;border-left:3px solid #84cc16;background:#f6f7f2;border-radius:6px;color:#3f3f46;font-style:italic;">${escapeHtml(input.message)}</blockquote>`
        : "",
      cta: { label: "Kampány megnyitása és pályázás", href: input.adUrl },
      footnote: "Ha most nem aktuális, nyugodtan figyelmen kívül hagyhatod ezt a meghívást.",
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

// ──────────────────────────────────────────────────────────────────────────
// PROFILKÉP-ÖSZTÖNZŐ KAMPÁNY (tartalomgyártóknak, akiknek nincs profilképük)
// ──────────────────────────────────────────────────────────────────────────
export function renderProfilePhotoNudgeEmail(input: {
  name: string;
  ctaUrl: string; // követett CTA-link
  pixelUrl?: string; // megnyitás-követő pixel
  stats?: { creators: number; brands: number; collaborations: number };
}): { subject: string; html: string } {
  const s = input.stats ?? { creators: 567, brands: 28, collaborations: 3 };
  const statTile = (value: number, label: string) => `
    <td align="center" style="padding:10px;background:#f6f7f2;border-radius:12px;">
      <div style="font-size:24px;font-weight:900;color:#3f6212;">${value}</div>
      <div style="font-size:12px;color:#52525b;">${label}</div>
    </td>`;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3f3f46;">
      Még <strong>kevesebb mint egy hete</strong> indult a Creatorz, és máris pörög a közösség:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;width:100%;">
      <tr>
        ${statTile(s.creators, "tartalomgyártó")}
        <td style="width:10px;"></td>
        ${statTile(s.brands, "márka")}
        <td style="width:10px;"></td>
        ${statTile(s.collaborations, "együttműködés")}
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3f3f46;">
      A márkák először a <strong>profilképet</strong> nézik — akinek van, <strong>sokkal több
      megkeresést</strong> kap. Tölts fel egy jó képet magadról, és <strong>töltsd ki a profilod
      minél részletesebben</strong> (kategóriák, bemutatkozás, közösségi linkek), hogy a megfelelő
      márkák megtaláljanak.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 4px;">
      <tr>
        <td align="center" bgcolor="#84cc16" style="border-radius:9999px;background:#84cc16;">
          <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#0a0a0a;text-decoration:none;border-radius:9999px;">Profilkép feltöltése →</a>
        </td>
      </tr>
    </table>`;

  return {
    subject: "Egy profilkép = sokkal több megkeresés 📸",
    html: renderBrandedEmail({
      preheader: "Tölts fel egy profilképet — sokkal több márka keres meg.",
      heading: "Ne maradj le — egy kép nagy különbség",
      greeting: `Szia ${input.name}!`,
      bodyHtml: body,
      footnote: "Ne maradj le senki mögött — pár perc az egész, és kész a profilod.",
      pixelUrl: input.pixelUrl,
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
