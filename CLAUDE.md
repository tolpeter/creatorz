@AGENTS.md

# Creatorz.hu — Project Context

## Mit építünk
Magyar UGC tartalomgyártó platform — directory + subscription modell.
Cégeknek ingyenes a böngészés és kapcsolatfelvétel.
Creatoroknak ingyenes vagy 2 990 Ft/hó (admin toggle).
Kiemelés vásárlás: 7 nap = 4 990 Ft, 30 nap = 12 990 Ft.
Brand hirdetés feladása ingyenes, creator pályázhat rá.
Review-k Modell A szerint: csak elfogadott pályázat után írható.

## Tech stack
- **Next.js 16** (App Router) + TypeScript — FIGYELEM: a master prompt Next 15-öt
  ír elő, de a projekt tudatosan Next 16-on fut (lásd döntés alább).
- Tailwind CSS **v4** + shadcn/ui (radix-nova stílus, Neutral base) — a v4
  `@import "tailwindcss"` + `@theme` szintaxist használja, NINCS tailwind.config.js
- Supabase (PostgreSQL + Auth + Storage)
- Drizzle ORM (postgres-js driver)
- Stripe Subscriptions (HUF, magyar fiók)
- Resend (emailek)
- Replicate FLUX.1 (kép-generálás)
- Vercel hosting

## Stack-eltérés a prompttól (2026-05-30 döntés)
A `create-next-app@latest` ma Next.js 16 + Tailwind v4-et telepít, nem Next 15 + v3-at.
A felhasználó a modern stacken maradt. A prompt Tailwind-v3 CSS-ét v4-re adaptáljuk.
NE állítsd vissza Next 15 / Tailwind v3-ra.

## Színek
- Háttér: #0A0A0A (fekete)
- Accent: #A3E635 (neon lime)
- Háttér világos: fehér + neutral szürkék
- A brand színek a `app/globals.css`-ben `--accent`, `--primary`, `--ring`
  CSS változókban (hex), oklch neutral skálával keverve.

## Konvenciók
- Fájlnevek: kebab-case (creator-profile.tsx)
- Komponensnevek: PascalCase (CreatorProfile)
- Server Components default, "use client" csak ahol kell
- Drizzle schema mindig `lib/db/schema.ts`-ben
- Server Actions a `app/actions/` mappában
- Env változók TypeScript-tel ellenőrizve: `lib/env.ts`
- Mindig magyar nyelvű UI szövegek
- A felhasználói facing dátumok magyar formátumban (2026.05.27.)
- Pénzek mindig HUF-ban (Ft), thousand separator szóköz: "2 990 Ft"
- shadcn komponensek a unified `radix-ui` csomagot importálják (pl. `Slot.Root`)

## Adatbázis főtáblák
users, creator_profiles, brand_profiles, portfolio_items,
ads, ad_applications, collaborations, reviews, review_responses,
subscriptions, feature_purchases, settings (admin), notifications

## Fontos szabályok
- SOHA ne commit-olj API kulcsot
- Mindig type-safe Server Actions (zod validáció)
- Sose használj browser storage-t (localStorage/sessionStorage) — Supabase session
- Magyar nyelv: minden UI szöveg, hibaüzenet, email
- Mobile-first: kezdés mobil layouttal
