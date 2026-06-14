# Creatorz.hu — Teljes élesítési kézikönyv

> **Ez a teljes, hivatalos lépésről-lépésre útmutató a weboldal élesítéséhez és a
> biztonságos, adatvesztés nélküli továbbfejlesztéshez.** Minden kötelező beállítás
> és lépés benne van. (A korábbi `DEPLOY.md` a gyors verzió; ez a bővebb, naprakész.)
>
> Stack: Next.js 16 · Supabase (Postgres/Auth/Storage) · Drizzle ORM · Stripe ·
> Resend · Replicate · OpenAI · Hosting: Vercel.

---

## 0. A legfontosabb elv — kód ≠ adat

- A **kód** a Vercelen fut; egy új deploy **csak a kódot** cseréli.
- Az **adatok** (profilok, üzenetek, hirdetések, MINDEN) a **Supabase
  adatbázisban** élnek, a kódtól függetlenül.
- ➡️ Egy sima deploy **soha nem töröl adatot**. Az **egyetlen** adatvesztési
  kockázat egy rossz **adatbázis-séma-változtatás**. Erre való a verziózott
  migráció + a backup (lásd 11. és 14. fejezet).

---

## 1. Szükséges fiókok (egyszeri)

| Szolgáltatás | Mire kell | Ajánlás |
|---|---|---|
| Vercel | Hosting, deploy, cron | Hobby kezdésnek, Pro forgalomnál |
| Supabase | DB + Auth + Storage | **Pro** (napi backup + PITR!) |
| Stripe | Előfizetés + kiemelés (HUF) | Magyar fiók |
| Resend | E-mailek | Ingyenessel indítható |
| Replicate | AI blog-borító kép | Pay-as-you-go |
| OpenAI | AI követőszám + blog | Pay-as-you-go |
| Domain (Rackhost) | creatorz.hu | + DNS hozzáférés |

---

## 2. Két Supabase projekt (PROD + DEV)

Hozz létre **két** projektet, hogy a fejlesztés soha ne érje az éles adatokat:

1. `creatorz-prod` — ÉLES, valódi felhasználók.
2. `creatorz-dev` — fejlesztéshez.

Mindkettőnél jegyezd fel (Settings → API / Database):
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public kulcs → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role kulcs → `SUPABASE_SERVICE_ROLE_KEY` (TITKOS!)
- Connection string (**Transaction pooler, 6543**) → `DATABASE_URL`

---

## 3. Adatbázis-séma a PROD-ra (verziózott migrációk)

A séma a `lib/db/migrations/` mappában van verziózva (`0000…0002`). **Élesben NE
használd a `db:push`-t** — mindig a migrációkat futtasd:

```bash
# Egy ÜRES prod DB-re (létrehozza mind a 20 táblát + indexet):
DATABASE_URL="<PROD_CONNECTION_STRING>" npm run db:migrate
```

A `0002_launch_baseline` migráció **tisztán additív** (5 új tábla + oszlopok, 0
DROP). A `db:migrate` nyilvántartja a már lefutott migrációkat, így később csak az
ÚJAK futnak.

> **Jövőbeli séma-változás:** `schema.ts` szerkeszt → `npm run db:generate` (új SQL)
> → dev DB-n teszt → commit → prod-on `npm run db:migrate` (backup után).

---

## 4. Supabase Storage bucketök

Hozd létre ezeket **publikus** bucketként (Storage → New bucket → Public):

`avatars` · `banners` · `portfolio` · `logos` · `messages` · `blog`

Mindegyikhez RLS policy (Storage → Policies), a `<bucket>` helyére a névvel:
- **SELECT:** `bucket_id = '<bucket>'`
- **INSERT:** `bucket_id = '<bucket>' AND auth.role() = 'authenticated'`
- **UPDATE/DELETE:** `bucket_id = '<bucket>' AND (auth.uid())::text = (storage.foldername(name))[1]`

---

## 5. Supabase Auth beállítások

- **URL Configuration:** Site URL `https://creatorz.hu`; Redirect URLs:
  `https://creatorz.hu/**`, `https://*.vercel.app/**`.
- **Email templates:** magyarítsd a megerősítő / jelszó-reset / magic link sablonokat.
- **MFA (TOTP):** engedélyezd — a kód támogatja a kétfaktoros belépést, a
  jelszó-resetet és a jelszó-frissítést (Beállítások oldalon).

---

## 6. Stripe (HUF) — Test módban indul, később Live

**6.1 Test mode (soft launch):** `pk_test_…` / `sk_test_…`, és a 3 termék test
price ID-ja → `STRIPE_PRICE_CREATOR_MONTHLY`, `_FEATURE_7DAY`, `_FEATURE_30DAY`.

**6.2 Webhook:** Stripe → Webhooks → endpoint
`https://creatorz.hu/api/webhooks/stripe`, események:
`checkout.session.completed`, `customer.subscription.created/updated/deleted`,
`invoice.paid`, `invoice.payment_failed`. A Signing secret → `STRIPE_WEBHOOK_SECRET`.

**6.3 Live mode (amikor minden teszt zöld):** váltás Live-ra → 3 termék újra
létrehozása ugyanazokkal az árakkal → új Live price ID-k + kulcsok + új Live
webhook secret a Vercel env-be → Redeploy.

---

## 7. Resend (e-mailek)

1. Domain hozzáadása + DNS (SPF/DKIM) → verifikáció.
2. `RESEND_API_KEY`, `EMAIL_FROM=Creatorz <hello@creatorz.hu>` (verifikált domain!),
   `ADMIN_EMAIL` (ide jönnek a kapcsolati üzenetek és moderációs riasztások).

---

## 8. Vercel projekt + env változók

1. vercel.com/new → Import a Git repo → Framework: Next.js. **Deploy előtt** töltsd
   ki az env változókat!
2. Environment Variables — **KÜLÖN Production és Preview**:
   - **Production** = prod Supabase + Stripe **LIVE** + `NEXT_PUBLIC_APP_URL=https://creatorz.hu`
   - **Preview** = dev Supabase + Stripe **TEST**
3. Build: `npm run build` (alap). A `vercel.json` tartalmazza a cronokat.

### Kötelező env változók

| Változó | Környezet | Megjegyzés |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod + Preview | projektenként más |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod + Preview | |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod + Preview | titkos |
| `DATABASE_URL` | Prod + Preview | transaction pooler |
| `NEXT_PUBLIC_APP_URL` | Prod + Preview | prod: https://creatorz.hu |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Prod=LIVE / Preview=TEST | |
| `STRIPE_SECRET_KEY` | Prod=LIVE / Preview=TEST | titkos |
| `STRIPE_WEBHOOK_SECRET` | Prod | webhook signing secret |
| `STRIPE_PRICE_CREATOR_MONTHLY` | Prod + Preview | |
| `STRIPE_PRICE_FEATURE_7DAY` | Prod + Preview | |
| `STRIPE_PRICE_FEATURE_30DAY` | Prod + Preview | |
| `RESEND_API_KEY` | Prod + Preview | |
| `EMAIL_FROM` | Prod + Preview | verifikált domain |
| `ADMIN_EMAIL` | Prod + Preview | |
| `CRON_SECRET` | Prod | erős random string |
| `REPLICATE_API_TOKEN` | Prod + Preview | AI képhez |
| `OPENAI_API_KEY` | Prod + Preview | AI szöveghez |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` | Prod | opcionális analytics |
| `NEXT_PUBLIC_APP_NAME` | Prod + Preview | „Creatorz" |
| `YOUTUBE_API_KEY` / `META_GRAPH_API_TOKEN` | opcionális | scrape-hez |

---

## 9. Domain (creatorz.hu) + SSL

1. Vercel → Settings → Domains → Add `creatorz.hu`.
2. Rackhost DNS szerkesztő:
   - **A** rekord: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
   (a pontos értékeket a Vercel írja ki — azt kövesd)
3. SSL: a Vercel automatikusan kiállítja (Let's Encrypt).
4. `NEXT_PUBLIC_APP_URL=https://creatorz.hu` → Redeploy.

---

## 10. Cron jobok (automatikus, `vercel.json`)

| Útvonal | Ütemezés | Funkció |
|---|---|---|
| `/api/cron/expire-featured` | 6 óránként | Lejárt kiemelések kikapcsolása |
| `/api/cron/scrape-followers` | 4 naponta 03:00 | AI követőszám-frissítés |
| `/api/cron/review-emails` | naponta 10:00 | Értékelés-kérő emailek |
| `/api/cron/blog?count=1` | hétfő + csütörtök 07:00 | Heti 2 AI blogposzt |
| `/api/cron/digest` | hétfő 08:00 | Heti értesítés-összefoglaló |

Mind a `CRON_SECRET`-tel védett. Vercel → Settings → Cron Jobs alatt látszanak.

---

## 11. Backup és helyreállítás (a védőháló)

- **Supabase Pro → Point-in-Time Recovery (PITR):** az adatbázis bármely korábbi
  pillanatra visszaállítható — emberi hiba és rossz migráció ellen is véd.
- **Minden PROD migráció ELŐTT:** ellenőrizd, hogy a backup/PITR aktív.
- **Tilos PROD-on:** `DROP TABLE`, `DROP COLUMN`, oszlop átnevezése — csak
  „bővít → áttölt → elvesz" mintával, több lépcsőben.

---

## 12. Első admin felhasználó

1. Regisztrálj a `/register`-en az `ADMIN_EMAIL` címmel.
2. Supabase SQL editor:
   ```sql
   update users set role = 'admin', approved = true where email = '<ADMIN_EMAIL>';
   ```
3. Belépés → `/admin` elérhető.

---

## 13. Élesítés előtti tesztelési checklist

- [ ] `https://creatorz.hu` betölt, HTTPS zöld lakat
- [ ] Regisztráció (creator + brand) → megerősítő e-mail megérkezik
- [ ] Bejelentkezés + (opc.) MFA + jelszó-reset
- [ ] Creator profil + kép/portfólió/intro-videó feltöltés
- [ ] Kereső + szűrők + mentés (kedvenc) + válaszidő/aktivitás jelvény
- [ ] Hirdetés feladása → admin jóváhagyás → megjelenik (+ kiemelés)
- [ ] Pályázat → elfogadás → együttműködés-workflow (leadás/lezárás)
- [ ] Üzenet + fájlcsatolmány + értesítés (harang + email)
- [ ] Kétoldalú értékelés + admin moderáció
- [ ] Jelentés/blokkolás → admin felfüggesztés
- [ ] Stripe Test vásárlás `4242 4242 4242 4242` kártyával végigfut
- [ ] Webhook log: `checkout.session.completed` megérkezett
- [ ] Cron végpontok kézi hívása `CRON_SECRET`-tel → 200
- [ ] Cookie-banner + engedély után Analytics mér
- [ ] `/sitemap.xml` és `/robots.txt` elérhető
- [ ] Mobil nézet a fő oldalakon
- [ ] `npm run build` hibátlan

---

## 14. Élesítés UTÁNI biztonságos fejlesztés (napi menet)

1. `git checkout -b feature/uj-funkcio`
2. Helyi fejlesztés a **DEV** Supabase-szel (`.env.local`).
3. Séma-változás? → `schema.ts` → `npm run db:generate` → **dev** DB-n teszt.
4. `git push` → Vercel **Preview deploy** (saját URL, dev DB) → teszt.
5. Jó? → merge `main`-be → Vercel **élesre** deployol.
6. Volt migráció? → **prod backup ellenőrzés**, majd
   `DATABASE_URL="<PROD>" npm run db:migrate`.

➡️ A valódi felhasználók adatait soha nem éred el fejlesztés közben, és minden
változás látható/tesztelhető élesítés előtt.

---

## 15. Rollback (ha baj van)

- **Kód:** Vercel → Deployments → korábbi deploy → „Promote to Production"
  (azonnali, adat érintetlen).
- **Adatbázis:** Supabase → Database → PITR → visszaállítás a hiba előtti időre.

---

## 16. Soft launch (te végzed)

- 20-30 magyar UGC creatort + 5-10 márkát hívj meg személyesen.
- Készíts 1-2 valódi demo együttműködést (legyen review + kiemelt creator).
- Posztold a saját közösségi felületeidre, gyűjts 1 hét feedbacket.

---

*Verzió: 2026.06.10. — séma: `lib/db/migrations/0000…0002`. A konkrét, korábbi
projekt-specifikus értékek (Supabase URL, Stripe price ID-k) a `DEPLOY.md`-ben.*
