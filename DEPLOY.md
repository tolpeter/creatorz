# Creatorz.hu — Deployment útmutató (12. fázis)

Ez a doku a **te lépéseidet** írja le, a Vercel + DNS + Stripe production setupot.

> A kód készen áll. Lokálisan a `scripts/preflight.mjs` minden zöld:
> ```powershell
> node --env-file=.env.local scripts/preflight.mjs
> ```

---

## 1. Soft launch (Test mode) — első deploy

**Cél:** a `creatorz.hu` (vagy a `*.vercel.app` ideiglenes URL) működik, **Stripe Test mode kulcsokkal**. Itt mindent ki tudsz próbálni anélkül, hogy valódi pénz mozdulna.

### 1.1 Vercel projekt létrehozása

1. <https://vercel.com/new> → **Import Git Repository** → válaszd `tolpeter/creatorz`-ot
2. Framework: **Next.js** (auto-detect)
3. **NE klikkelj a Deploy gombra, amíg az env változókat be nem állítottad!**

### 1.2 Environment Variables (Production)

A „Configure Project" → **Environment Variables** szekcióba másold be ezeket (a `.env.local` aktuális értékeivel — Test mode-ban indulsz):

| Név | Érték (másold a `.env.local`-ból) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://myrftqqlqsfhssfclybt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (legacy anon JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role JWT) |
| `DATABASE_URL` | (transaction pooler string) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` (Test) |
| `STRIPE_SECRET_KEY` | `sk_test_…` (Test) |
| `STRIPE_WEBHOOK_SECRET` | **MÉG ÜRES** — 1.4-ben állítjuk |
| `STRIPE_PRICE_CREATOR_MONTHLY` | `price_1TdTIhKlOCInb37M6Mle78KV` |
| `STRIPE_PRICE_FEATURE_7DAY` | `price_1TdTbhKlOCInb37M5hQ0h19f` |
| `STRIPE_PRICE_FEATURE_30DAY` | `price_1TdTbyKlOCInb37M8QNNVkbQ` |
| `RESEND_API_KEY` | `re_…` |
| `EMAIL_FROM` | `Creatorz <info@videmark.hu>` (a 1.5-ig) |
| `REPLICATE_API_TOKEN` | `r8_…` |
| `NEXT_PUBLIC_APP_URL` | `https://creatorz.hu` (vagy a vercel.app URL, ha még nincs domain) |
| `NEXT_PUBLIC_APP_NAME` | `Creatorz` |
| `ADMIN_EMAIL` | `info@videmark.hu` |
| `CRON_SECRET` | (a `.env.local`-ban lévő érték) |
| `NEXT_PUBLIC_CREATOR_SUBSCRIPTION_ENABLED` | `false` |
| `NEXT_PUBLIC_CREATOR_SUBSCRIPTION_PRICE_HUF` | `2490` |
| `NEXT_PUBLIC_FEATURE_7DAY_PRICE_HUF` | `3990` |
| `NEXT_PUBLIC_FEATURE_30DAY_PRICE_HUF` | `5990` |

> Mindegyiknél hagyd az alapértelmezett scope-ot („All environments").

### 1.3 Deploy

Klikkelj a **Deploy** gombra. ~3-5 perc.
Sikeres deploy után kapsz egy ideiglenes URL-t: `creatorz-xyz.vercel.app`.

**Ellenőrizd:**
- A landing betöltődik
- `/creators` → Anna Kreátor látszik (a DB ugyanaz, mint lokálisan)
- `/admin` → admin login működik

### 1.4 Stripe webhook (Test mode-hoz)

1. <https://dashboard.stripe.com/test/webhooks> → **Add endpoint**
2. URL: `https://<a-vercel-url-ed>/api/webhooks/stripe`
3. Események:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Mentés → másold ki a **Signing Secret**-et (`whsec_…`)
5. Vercel → Project → Settings → Environment Variables → szerkeszd a `STRIPE_WEBHOOK_SECRET`-et erre az értékre
6. Vercel → **Redeploy** (Deployments → … → Redeploy)

### 1.5 Resend domain (opcionális, de ajánlott)

- Resend Dashboard → Domains → **Add Domain** → `creatorz.hu` (élesítés után) **vagy** `videmark.hu` (most)
- A megadott DNS rekordokat (SPF + DKIM) vidd be a domain szolgáltatódhoz
- Verifikáció után írd át az `EMAIL_FROM`-ot pl. `Creatorz <hello@creatorz.hu>`-ra

---

## 2. Custom domain (creatorz.hu)

### 2.1 Domain regisztráció (ha még nincs)
- Rackhost.hu → keresd a `creatorz.hu`-t → rendeld meg
- Várj 1-3 munkanapot a `.hu` bejegyzésre

### 2.2 Vercel-en domain hozzáadás
1. Vercel Project → **Settings** → **Domains** → Add `creatorz.hu`
2. Vercel kiírja a DNS rekordokat:
   - `A @ → 76.76.21.21`
   - `CNAME www → cname.vercel-dns.com`

### 2.3 Rackhost DNS
1. <https://my.rackhost.hu> → Domain → `creatorz.hu` → DNS szerkesztő
2. **A rekord** — Név: `@` (vagy üres), Típus: `A`, IP: `76.76.21.21`, TTL: 3600
3. **CNAME rekord** — Név: `www`, Típus: `CNAME`, Érték: `cname.vercel-dns.com`, TTL: 3600
4. Mentés → várj 10-30 percet (DNS propagálódik)

### 2.4 SSL
Vercel automatikusan kiállítja a Let's Encrypt tanúsítványt. Pár perc után <https://creatorz.hu> működik.

### 2.5 Frissítsd a `NEXT_PUBLIC_APP_URL`-t
Vercel env → `NEXT_PUBLIC_APP_URL = https://creatorz.hu` → **Redeploy**.

---

## 3. Stripe Live mode (csak ha készen állsz az igazi fizetésekre)

> ⚠️ A test mode-ban induljon a soft launch. **Ezt a részt akkor csináld, amikor minden teszt sikeres**.

1. Stripe Dashboard → bal felső **Toggle Test/Live** → **Live mode**
2. **Hozd létre újra** a 3 terméket Live-ban (Creator havi, 7 napos kiemelés, 30 napos kiemelés) — az **árakat ugyanúgy** állítsd be
3. Másold ki az új **Live Price ID-kat**
4. Vercel env-ben **cseréld le**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*` mindhárom
5. **Új Live webhook**: Live mode → Webhooks → Add endpoint (URL: `https://creatorz.hu/api/webhooks/stripe`, ugyanazok az események) → új `STRIPE_WEBHOOK_SECRET` → Vercel env
6. Redeploy

---

## 4. Vercel Cron Jobs ellenőrzése

A `vercel.json` 3 cron-ot definiál:
- `0 */6 * * *` — `/api/cron/expire-featured` (6 óránként lejárt featured profilok)
- `0 3 * * 1` — `/api/cron/scrape-followers` (hétfő reggel 3:00 follower scrape)
- `0 10 * * *` — `/api/cron/review-emails` (naponta 10:00 review prompt emailek)

Vercel Project → **Settings** → **Cron Jobs** — itt látnod kell mind a 3-at.

> ⚠️ A cron jobok **csak a Vercel Hobby+ ingyenes csomagjában** futnak — alacsony Hobby cron-limit van; ha többre van szükség, Pro plan kell.

---

## 5. Final checklist (soft launch előtt)

- [ ] `https://creatorz.hu` betölt, HTTPS lakat zöld
- [ ] Új user regisztráció (creator + brand) működik live
- [ ] Email értesítések megérkeznek (Resend log)
- [ ] Stripe **Test mode** vásárlási teszt: `4242 4242 4242 4242` kártyával 7 napos kiemelés végigfut
- [ ] Webhook log: `checkout.session.completed` event eljutott a `/api/webhooks/stripe`-hoz
- [ ] Admin login működik (`admin@videmark.hu`)
- [ ] `https://creatorz.hu/sitemap.xml` elérhető
- [ ] `https://creatorz.hu/robots.txt` elérhető
- [ ] Cron jobok megjelennek a Vercel Settings → Cron Jobs-on

---

## Soft launch (te végzed)

- 20-30 magyar UGC creatort hívj meg személyesen (Facebook csoport, Discord, ismerősök)
- 5-10 márkát hívj meg személyesen
- Készíts 1-2 valódi demo collaboration-t (te magad, hogy legyen review és kiemelt creator)
- Posztold a saját social-jeidre
- Várj 1 hetet, gyűjts feedbacket

**Hajrá! 🚀**
