// ───────────────────────────────────────────────────────────────────────────
// Profilkép-ösztönző email-kampány a tartalomgyártóknak, AKIKNEK NINCS profilképük.
//
// Követés: minden emailben egyedi tracking pixel (megnyitás) + követett CTA-link
// (kattintás). A "konverziót" (ki töltött fel utána profilképet) az admin
// /admin/campaigns oldalon látod, a feladott userek profilját összevetve.
//
// HASZNÁLAT
//   Próba (NEM küld, csak kiírja kinek menne):
//     node --env-file=.env.local scripts/send-profile-photo-campaign.mjs
//   Teszt-email magadnak (1 db, valódi tartalom):
//     node --env-file=.env.local scripts/send-profile-photo-campaign.mjs --test=te@pelda.hu
//   ÉLES küldés mindenkinek:
//     node --env-file=.env.local scripts/send-profile-photo-campaign.mjs --send
//   Korlátozott küldés (pl. első 50, óvatos indításhoz):
//     node --env-file=.env.local scripts/send-profile-photo-campaign.mjs --send --limit=50
//
// Idempotens: aki már kapott emailt EBBEN a kampányban, azt kihagyja.
// ───────────────────────────────────────────────────────────────────────────
import postgres from "postgres";
import crypto from "node:crypto";
import { Resend } from "resend";

const CAMPAIGN = "profile-photo-2026-06";

// A levélbe írt statisztika (az indítás kommunikációja).
const STATS = { creators: 567, brands: 28, collaborations: 3 };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
const EMAIL_FROM = process.env.EMAIL_FROM || "Creatorz <onboarding@resend.dev>";
const SUPPORT_EMAIL = process.env.ADMIN_EMAIL || "info@creatorz.hu";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const TEST = (args.find((a) => a.startsWith("--test=")) || "").split("=")[1] || "";
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || "0") || 0;

if (!process.env.DATABASE_URL) {
  console.error("Hiányzó env: DATABASE_URL");
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Branded HTML — önálló, hogy a script ne függjön a server-only moduloktól. */
function buildEmail(name, token) {
  const ctaUrl = `${APP_URL}/api/email/c/${token}`;
  const pixelUrl = `${APP_URL}/api/email/o/${token}`;
  const subject = "Egy profilkép = sokkal több megkeresés 📸";
  const html = `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light only"/><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Tölts fel egy profilképet — sokkal több márka keres meg.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f7f2;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 4px 18px;" align="left">
<a href="${esc(APP_URL)}" style="font-size:22px;font-weight:900;color:#0a0a0a;text-decoration:none;letter-spacing:-0.5px;">creator<span style="color:#84cc16;">z</span></a>
</td></tr>
<tr><td style="background:#ffffff;border-radius:18px;border:1px solid #e7e7e2;padding:32px 30px;">
<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#0a0a0a;font-weight:900;letter-spacing:-0.3px;">Ne maradj le — egy kép nagy különbség</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#0a0a0a;font-weight:600;">Szia ${esc(name)}!</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3f3f46;">
Még <strong>kevesebb mint egy hete</strong> indult a Creatorz, és máris pörög a közösség:
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;width:100%;">
<tr>
<td align="center" style="padding:10px;background:#f6f7f2;border-radius:12px;">
<div style="font-size:24px;font-weight:900;color:#3f6212;">${STATS.creators}</div>
<div style="font-size:12px;color:#52525b;">tartalomgyártó</div>
</td>
<td style="width:10px;"></td>
<td align="center" style="padding:10px;background:#f6f7f2;border-radius:12px;">
<div style="font-size:24px;font-weight:900;color:#3f6212;">${STATS.brands}</div>
<div style="font-size:12px;color:#52525b;">márka</div>
</td>
<td style="width:10px;"></td>
<td align="center" style="padding:10px;background:#f6f7f2;border-radius:12px;">
<div style="font-size:24px;font-weight:900;color:#3f6212;">${STATS.collaborations}</div>
<div style="font-size:12px;color:#52525b;">együttműködés</div>
</td>
</tr>
</table>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3f3f46;">
A márkák először a <strong>profilképet</strong> nézik — akinek van, <strong>sokkal több megkeresést</strong> kap.
Tölts fel egy jó képet magadról, és <strong>töltsd ki a profilod minél részletesebben</strong>
(kategóriák, bemutatkozás, közösségi linkek), hogy a megfelelő márkák megtaláljanak.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;">
<tr><td align="center" bgcolor="#84cc16" style="border-radius:9999px;background:#84cc16;">
<a href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#0a0a0a;text-decoration:none;border-radius:9999px;">Profilkép feltöltése →</a>
</td></tr>
</table>
<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#71717a;"><strong>Ne maradj le senki mögött</strong> — pár perc az egész, és kész a profilod.</p>
</td></tr>
<tr><td style="padding:22px 6px 0;" align="center">
<p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#71717a;">Creatorz.hu &middot; A magyar UGC tartalomgyártók közössége</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">Kérdésed van? Írj nekünk: <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:#4d7c0f;text-decoration:none;">${esc(SUPPORT_EMAIL)}</a></p>
</td></tr>
</table>
</td></tr>
</table>
<img src="${esc(pixelUrl)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />
</body></html>`;
  return { subject, html };
}

async function sendOne(to, name, token) {
  if (!resend) return { ok: false, error: "RESEND_API_KEY hiányzik" };
  const { subject, html } = buildEmail(name, token);
  try {
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  // Teszt-email: 1 db, valódi tartalom, DB-írás nélkül.
  if (TEST) {
    const token = "test-" + crypto.randomBytes(8).toString("hex");
    const res = await sendOne(TEST, "Teszt Felhasználó", token);
    console.log(res.ok ? `✓ Teszt-email elküldve: ${TEST}` : `✗ Teszt-email hiba: ${res.error}`);
    return;
  }

  // Címzettek: profilkép NÉLKÜLI, nem felfüggesztett tartalomgyártók.
  const recipients = await sql`
    SELECT cp.user_id AS "userId", cp.display_name AS "name", u.email AS "email"
    FROM creator_profiles cp
    JOIN users u ON u.id = cp.user_id
    WHERE (cp.avatar_url IS NULL OR cp.avatar_url = '')
      AND u.role = 'creator'
      AND u.suspended = false
    ORDER BY u.created_at ASC
  `;

  // Akik már kaptak ebben a kampányban — kihagyjuk.
  const already = await sql`
    SELECT user_id AS "userId" FROM email_campaign_recipients WHERE campaign = ${CAMPAIGN}
  `;
  const sentSet = new Set(already.map((r) => r.userId));
  let todo = recipients.filter((r) => !sentSet.has(r.userId));
  if (LIMIT > 0) todo = todo.slice(0, LIMIT);

  console.log(`Kampány: ${CAMPAIGN}`);
  console.log(`Profilkép nélküli tartalomgyártó: ${recipients.length}`);
  console.log(`Már megkapta: ${sentSet.size}`);
  console.log(`Most küldendő: ${todo.length}${LIMIT ? ` (limit: ${LIMIT})` : ""}`);

  if (!SEND) {
    console.log("\n— DRY RUN — (nem küld semmit). Minta az első 10 címzettből:");
    todo.slice(0, 10).forEach((r) => console.log(`   • ${r.email}  (${r.name})`));
    console.log("\nÉles küldéshez:  node --env-file=.env.local scripts/send-profile-photo-campaign.mjs --send");
    console.log("Teszt magadnak:  node --env-file=.env.local scripts/send-profile-photo-campaign.mjs --test=te@pelda.hu");
    return;
  }

  if (!resend) {
    console.error("RESEND_API_KEY hiányzik — nem tudok küldeni.");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const r of todo) {
    const token = crypto.randomBytes(16).toString("hex");
    const res = await sendOne(r.email, r.name || "tartalomgyártó", token);
    if (res.ok) {
      // Csak sikeres küldés után rögzítjük (újrafuttatáskor nem küldjük újra).
      await sql`
        INSERT INTO email_campaign_recipients (campaign, user_id, email, token, sent_at)
        VALUES (${CAMPAIGN}, ${r.userId}, ${r.email}, ${token}, now())
        ON CONFLICT (campaign, user_id) DO NOTHING
      `;
      ok++;
    } else {
      fail++;
      console.warn(`   ✗ ${r.email}: ${res.error}`);
    }
    await new Promise((res2) => setTimeout(res2, 120)); // kíméletes ütemezés
  }

  console.log(`\n✅ Kész. Elküldve: ${ok}, hiba: ${fail}`);
  console.log(`   Eredmények: ${APP_URL}/admin/campaigns`);
}

main()
  .catch((e) => {
    console.error("❌ HIBA:", e.message);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
