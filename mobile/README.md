# Creatorz — mobil app (Expo / React Native)

Natív iOS + Android app a Creatorz platformhoz. A web (`creatorz.hu`) Supabase
backendjét és JSON API-ját használja.

## Mit tud most (v0.1 — alap)
- ✅ Belépés / regisztráció (Supabase auth), session megőrzése
- ✅ Tartalomgyártók böngészése (élő adat, kereső, végtelen görgetés)
- ✅ Tab-navigáció: Tartalomgyártók · Hirdetések · Üzenetek · Profil
- ✅ Kijelentkezés
- 🔜 Creator-profil részletek, Hirdetések + pályázás, Üzenetek + push

## Első indítás (Windows is jó)

1. **Node 18+** és (egyszer) az Expo CLI nem kell külön — `npx` intézi.
2. A `mobile/` mappában:
   ```bash
   npm install
   ```
   Ha verzió-figyelmeztetést kapsz: `npx expo install --fix`
3. Másold a `.env.example`-t `.env`-be, és töltsd ki:
   - `EXPO_PUBLIC_SUPABASE_URL` és `EXPO_PUBLIC_SUPABASE_ANON_KEY` — ugyanaz,
     mint a web `.env.local`-ban (publikus, RLS-védett kulcsok).
   - `EXPO_PUBLIC_API_URL` — `https://creatorz.hu` (vagy a saját gép IP-je dev API-hoz).
4. Indítás:
   ```bash
   npx expo start
   ```
   - Telefonon: töltsd le az **Expo Go** appot, és olvasd be a QR-kódot.
   - Vagy `a` (Android emulátor) / `i` (iOS szimulátor, Mac kell hozzá).

## Store-ba juttatás (később, EAS — Mac nélkül is)
```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p android   # és/vagy -p ios
eas submit -p android  # Play Console / App Store feltöltés
```
Ehhez kell: Apple Developer fiók (~$99/év), Google Play fiók ($25 egyszeri),
app-ikon és splash kép (`assets/`), valamint a `hu.creatorz.app` bundle id.

## Felépítés
- `app/` — expo-router képernyők (fájl-alapú útvonalak)
  - `(auth)/` — belépés, regisztráció
  - `(tabs)/` — fő tabok
- `context/auth.tsx` — session provider
- `lib/supabase.ts` — Supabase kliens (AsyncStorage session)
- `lib/api.ts` — web API hívások (JWT-vel a védett végpontokhoz)
- `lib/theme.ts` — márkaszínek
