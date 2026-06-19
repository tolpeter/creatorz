# Creatorz mobil — build & store kiadás (EAS)

Ez a leírás a tényleges, telepíthető app elkészítését és a store-okba juttatását
írja le. A parancsokat a `mobile/` mappában futtasd.

## 0. Előfeltételek
- **Expo-fiók** (ingyenes): https://expo.dev — regisztrálj.
- **App-ikon**: 1024×1024 PNG → `mobile/assets/icon.png`, és állítsd be az
  `app.json`-ban (`"icon": "./assets/icon.png"`). Enélkül Expo-alapikon lesz.
- Store-fiókok (a kiadáshoz): **Apple Developer** (~$99/év), **Google Play** ($25 egyszeri).

## 1. EAS CLI + bejelentkezés
```bash
npm install -g eas-cli
eas login
```

## 2. Projekt inicializálás (egyszer)
Ez beállítja az EAS `projectId`-t az `app.json`-ba (ez kell a push tokenhez is):
```bash
eas init
```

## 3. Tesztelhető build (dev/preview)
- **Android APK** (telefonra oldalról telepíthető, push is működik):
  ```bash
  eas build -p android --profile preview
  ```
  A végén kapsz egy letölthető `.apk` linket → telepítsd a telefonra.
- **Development build** (Expo Go helyett, live reloaddal + push):
  ```bash
  eas build -p android --profile development
  eas build -p ios --profile development   # iOS-hez Apple-fiók kell
  ```

## 4. Push beállítás
- A push token a `projectId` után működik (a 2. lépés után).
- **Android**: az Expo push szolgáltatáshoz FCM v1 kulcs kell — az EAS végigvezet
  (`eas credentials` → Android → FCM), vagy a build során kéri.
- **iOS**: az EAS automatikusan kezeli az APNs kulcsot (`eas credentials`).
- A token tárolásához a webes DB-ben futtasd a migrációt (a webes projektben):
  ```bash
  node --env-file=.env.local scripts/migrate-push-tokens.mjs
  ```

## 5. Store build + feltöltés
```bash
eas build -p android --profile production
eas build -p ios --profile production
eas submit -p android --latest
eas submit -p ios --latest
```
- A `submit` feltölti a Play Console / App Store Connect felületére.
- Utána a store saját felületén kell kitölteni az adatlapot (leírás, képernyőképek,
  adatvédelmi nyilatkozat — már megvan: creatorz.hu/adatvedelem) és beküldeni felülvizsgálatra.

## Verziók
Az `eas.json` `appVersionSource: remote` — az EAS kezeli a build-számot
(`autoIncrement`), neked csak a `version`-t kell emelni az `app.json`-ban kiadásonként.
