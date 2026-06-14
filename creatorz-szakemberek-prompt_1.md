# 🎬 CREATORZ.HU — KIEGÉSZÍTŐ FEJLESZTÉSI PROMPT

## Kreatív szakemberek (videóvágó, fotós, operatőr) + típus-szűrő

---

## ⚠️ FONTOS A CLAUDE CODE-NAK — OLVASD EL ELŐSZÖR

- A Creatorz projekt **MÁR KÉSZ és fut**. Ez egy **KIEGÉSZÍTÉS** a meglévő kódbázishoz, NEM új projekt.
- A **rate card funkciót a felhasználó MÁR ELTÁVOLÍTOTTA**. NE hivatkozz rá, NE add vissza, NE keress utána a kódban azzal a céllal, hogy visszaállítsd.
- A munkát **fázisokra bontva** végezd, és a végén állj meg az **✋ ELLENŐRZÉSI PONT**-nál.

---

# 🔍 FÁZIS 0 — KÖTELEZŐ: A MEGLÉVŐ PROJEKT ÁTNÉZÉSE (MIELŐTT BÁRMIT MÓDOSÍTASZ)

**Ez a legfontosabb lépés. NE írj egyetlen sor kódot sem, amíg végig nem nézted a meglévő projektet és meg nem értetted a felépítését, a dizájnját és a konvencióit. A cél: az új funkció úgy nézzen ki és úgy működjön, mintha az eredeti fejlesztés része lett volna — NE rontsd el a már működő felületet.**

## 0.1 Nézd át a teljes meglévő kódbázist

Olvasd be és értsd meg ezeket, MIELŐTT bármihez hozzányúlnál:

- `lib/db/schema.ts` — a jelenlegi adatmodell (milyen táblák, mezők, enumok vannak MOST)
- `lib/constants.ts` — meglévő konstansok, kategóriák
- `app/globals.css` — a pontos színek, CSS változók, radius értékek
- `tailwind.config.*` — a téma beállításai
- `components/ui/` — milyen shadcn/ui komponensek vannak telepítve és hogyan stílusozottak
- `components/` (layout, creator, brand, shared) — a meglévő komponensek, hogyan épülnek fel
- A **regisztrációs oldal** (`app/(auth)/register/...`) — hogyan néznek ki MOST a választó gombok/kártyák, milyen képet/illusztrációt használnak, milyen elrendezésben
- A **creator böngésző** (directory) oldal — a jelenlegi card design, szűrők, elrendezés
- A **creator profil oldal** (`app/(public)/creators/[username]/...`) — a jelenlegi szekciók, layout
- Az **onboarding wizard** — a jelenlegi lépések, form-stílus, validáció
- A **kép-generáló script** (`scripts/generate-images.ts` vagy hasonló) — milyen FLUX promptokkal készültek a meglévő képek, milyen stílusban, méretben

## 0.2 Készíts egy rövid összefoglalót magadnak (és írd ki nekem)

Mielőtt kódolni kezdesz, írd le röviden (a felhasználónak megjelenítve):
- Milyen a regisztrációs oldal jelenlegi felépítése (hány gomb/kártya, milyen képpel, milyen elrendezésben)
- Milyen design-tokeneket használ a projekt (színek, radius, árnyékok, tipográfia, spacing)
- Milyen komponens-mintákat követ (pl. hogyan épül fel egy Card, egy form, egy badge)
- Hogyan készültek a meglévő képek (FLUX modell, prompt-stílus, méret/arány)

**Ezután kérj megerősítést tőlem, hogy jól értetted-e, mielőtt elkezded a fejlesztést.**

## 0.3 Dizájn- és biztonsági szabályok (VÉGIG tartsd be)

- **Illeszkedés:** az új felületek (szakember card, profil, onboarding, regisztrációs gomb) PONTOSAN ugyanazokat a design-tokeneket, komponenseket, térközöket, betűtípust és színeket használják, mint a meglévő oldal. Ne vezess be új stílust, új színt, új komponens-könyvtárat.
- **Újrahasznosítás:** ahol lehet, a MEGLÉVŐ komponenseket bővítsd/használd újra (pl. a meglévő Card, Badge, Button, form mezők), ne készíts párhuzamos, máshogy kinéző verziókat.
- **Ne törj el semmit:** a meglévő UGC creator flow, a brand flow, a böngésző, a profil, a hirdetés és a fizetés VÁLTOZATLANUL működjön tovább. Additív módon dolgozz. Ha egy meglévő fájlt módosítasz, csak a szükséges minimumot változtasd.
- **Visszafelé kompatibilitás:** a meglévő adatbázis-sorok és userek ne sérüljenek (új mezők default értékkel jönnek).
- **Színek:** fekete (#0A0A0A) + neon lime (#A3E635) — de ezt a `globals.css`-ből vedd, ne hardcode-old újra.
- **Minden UI szöveg magyar.**
- Ha bármilyen eltérést tapasztalsz a lenti instrukciók és a tényleges kód között, **a tényleges kódhoz igazodj**, és jelezd nekem az eltérést.

---

## 🎯 MIT ÉPÍTÜNK

A platform eddig csak **UGC tartalomgyártókat** kezelt. Most bővítjük **kreatív szakemberekkel**:

- **Videóvágó**
- **Fotós**
- **Operatőr**

(Más típus NEM kell: hangmérnök, grafikus, AI videó alkotó — ezeket NE add hozzá.)

### Két alapelv

1. **Egy közös directory, típus-szűrővel.** Az UGC creatorok és a szakemberek ugyanabban a böngészőben jelennek meg, egy típus-szűrő választja szét őket. NE csinálj külön aloldalakat.

2. **A szakembereknek MÁS, egyszerűbb adatlap kell.** Nekik nem kell a teljes UGC profil — nekik **portfólió-alapú adatlap** kell:
   - Csak külső linkekkel dolgoznak (Google Drive videó link VAGY más külső link).
   - **Ha Google Drive videó linket adnak meg → az előnézetben (beágyazva) jelenjen meg a weboldalon.**
   - Más külső linknél (YouTube, Vimeo) szintén beágyazott előnézet; egyéb linknél kattintható "Megnyitás" gomb.

---

# FÁZIS A — ADATMODELL BŐVÍTÉS

## A.1 Új enum és mezők a `creator_profiles` táblához

A `lib/db/schema.ts`-ben add hozzá az új enumot:

```typescript
export const profileKindEnum = pgEnum("profile_kind", ["ugc", "professional"]);
```

A `creatorProfiles` táblához add hozzá ezeket a mezőket (a meglévők mellé, NE törölj semmit):

```typescript
// Profil típusa: UGC tartalomgyártó vagy kreatív szakember
profileKind: profileKindEnum("profile_kind").notNull().default("ugc"),

// Csak professional profilnál: mely szerepköröket tölti be (több is lehet)
// Értékek: "editor" (videóvágó) | "photographer" (fotós) | "videographer" (operatőr)
professionalRoles: jsonb("professional_roles").$type<string[]>().notNull().default([]),

// Csak professional profilnál: szabad szöveges szakterület/stílus chip-ek
// pl. ["esküvő", "reklámfilm", "termékfotó", "esemény"]
specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
```

## A.2 A `portfolio_items` tábla bővítése külső linkekhez

A meglévő portfólió rendszer fájlokat tölt fel a Supabase Storage-ba. A szakemberek viszont **külső linkeket** adnak meg. Bővítsd a `portfolioItems` táblát, hogy mindkettőt kezelje:

```typescript
// Külső link esetén ide kerül az URL (Drive / YouTube / Vimeo / egyéb).
// Ha ez ki van töltve, akkor ez egy külső link portfólió elem, nem feltöltött fájl.
externalUrl: text("external_url"),

// A beágyazás típusa, mentéskor számoljuk ki a parseEmbedLink() segítségével.
// Értékek: "drive" | "youtube" | "vimeo" | "link" | null (ha feltöltött fájl)
embedType: varchar("embed_type", { length: 20 }),
```

A meglévő `url` (Supabase Storage), `type` (video/photo), `thumbnailUrl` mezők maradnak — a feltöltött UGC portfólióhoz használjuk. A `type` mező a `portfolioTypeEnum`-ra hivatkozik; ha az csak `video`/`photo`-t enged, akkor a külső linkeknél állítsd `video`-ra alapból (a beágyazás úgyis a `embedType` alapján működik).

## A.3 Migration

```powershell
npx drizzle-kit generate
npx drizzle-kit push
```

A meglévő sorok automatikusan `profileKind = "ugc"` értéket kapnak (a default miatt), tehát a jelenlegi creatorok érintetlenek maradnak.

## A.4 Konstansok

A `lib/constants.ts`-be add hozzá:

```typescript
// Kreatív szakember szerepkörök (csak professional profilnál)
export const PROFESSIONAL_ROLES = [
  { value: "editor", label: "Videóvágó", emoji: "[vágó]" },
  { value: "photographer", label: "Fotós", emoji: "[fotó]" },
  { value: "videographer", label: "Operatőr", emoji: "[kamera]" },
] as const;

// A directory típus-szűrő opciói
export const DIRECTORY_TYPES = [
  { value: "all", label: "Összes alkotó" },
  { value: "ugc", label: "UGC tartalomgyártó" },
  { value: "editor", label: "Videóvágó" },
  { value: "photographer", label: "Fotós" },
  { value: "videographer", label: "Operatőr" },
] as const;

// Szakterület javaslatok (chip-ek, szabadon bővíthető)
export const SPECIALTY_SUGGESTIONS = [
  "Reklámfilm", "Esküvő", "Esemény", "Termékfotó", "Portré",
  "Klip", "Vlog", "Dokumentum", "Social media", "Termékvideó",
  "Ingatlan", "Gasztro", "Divat", "Sport", "Interjú",
] as const;
```

---

# FÁZIS B — BEÁGYAZÁS (EMBED) SEGÉDFÜGGVÉNY

Ez a kulcsfunkció: a külső linkből előnézetet csinál.

## B.1 Embed parser

Hozd létre: `lib/utils/embed.ts`

```typescript
export type EmbedType = "drive" | "youtube" | "vimeo" | "link";

export type ParsedEmbed = {
  type: EmbedType;
  embedUrl: string | null; // iframe src; null ha sima link
  originalUrl: string;
};

/**
 * Külső portfólió linkből beágyazható előnézetet készít.
 * - Google Drive videó link  -> /preview iframe
 * - YouTube                  -> /embed iframe
 * - Vimeo                    -> player iframe
 * - Minden más               -> sima kattintható link
 */
export function parseEmbedLink(url: string): ParsedEmbed {
  const clean = url.trim();

  // Google Drive: .../file/d/FILE_ID/view  vagy  open?id=FILE_ID
  const driveMatch = clean.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/
  );
  if (driveMatch) {
    return {
      type: "drive",
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      originalUrl: clean,
    };
  }

  // YouTube: watch?v=ID | youtu.be/ID | embed/ID | shorts/ID
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: clean,
    };
  }

  // Vimeo: vimeo.com/ID  vagy  vimeo.com/video/ID
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: clean,
    };
  }

  // Minden más: sima link
  return { type: "link", embedUrl: null, originalUrl: clean };
}
```

## B.2 Beágyazó komponens

Hozd létre: `components/shared/PortfolioEmbed.tsx`

```tsx
"use client";

import { parseEmbedLink } from "@/lib/utils/embed";
import { ExternalLink } from "lucide-react";

export function PortfolioEmbed({ url, title }: { url: string; title?: string }) {
  const parsed = parseEmbedLink(url);

  // Sima link (nem beágyazható) -> kártya kattintható gombbal
  if (parsed.type === "link" || !parsed.embedUrl) {
    return (
      <a
        href={parsed.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border bg-muted/40 p-8 text-sm font-medium transition-colors hover:bg-muted"
      >
        <ExternalLink className="h-4 w-4" />
        {title || "Munka megtekintése"} — megnyitás új lapon
      </a>
    );
  }

  // Beágyazható videó (Drive / YouTube / Vimeo)
  return (
    <div className="overflow-hidden rounded-xl border bg-black">
      <div className="aspect-video w-full">
        <iframe
          src={parsed.embedUrl}
          title={title || "Portfólió videó"}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && <p className="px-3 py-2 text-sm text-white/80">{title}</p>}
    </div>
  );
}
```

---

# FÁZIS C — REGISZTRÁCIÓ ÉS ONBOARDING

## C.1 Regisztrációs oldal — ÚJ harmadik gomb

A jelenlegi regisztrációs oldalon (`app/(auth)/register/...`) MOST két választó gomb/kártya van — nézd meg pontosan, hogyan néznek ki (kép, méret, elrendezés, szöveg, hover). A feladat: **adj hozzá egy harmadik, ugyanígy kinéző gombot/kártyát.**

### A három gomb a regisztrációs oldalon

```
[ Tartalomgyártó vagyok ]      -> role=creator,  profileKind="ugc"        (MEGLÉVŐ)
[ Videóvágó, Fotós,            -> role=creator,  profileKind="professional"  (ÚJ)
  Operatőr vagyok ]
[ Cégként regisztrálok ]       -> role=brand                              (MEGLÉVŐ)
```

**Követelmények:**
- A harmadik gomb/kártya **pontosan ugyanúgy nézzen ki**, mint a meglévő kettő: ugyanaz a méret, forma, radius, árnyék, betűtípus, hover-effekt, kép-elrendezés. Csak a felirat és a kép más.
- Felirat: **"Videóvágó, Fotós, Operatőr vagyok"**. Alá kis betűvel opcionálisan: *"Mutasd meg a munkáidat a márkáknak"*.
- A három kártya elrendezése maradjon harmonikus (pl. ha eddig 2 oszlop volt, most lehet 3 oszlop desktopon, 1 oszlop mobilon — illeszkedve a meglévő rácshoz).
- Kattintásra: `role=creator` + `profileKind="professional"`, majd a C.3 szakember onboarding indul.
- A meglévő két gomb működése és kinézete **ne változzon** (a 3 oszlopos elrendezésen kívül).

### A harmadik gomb KÉPÉNEK legenerálása

A meglévő két kártyának van egy-egy képe/illusztrációja (keresd meg, hol és hogyan készültek — valószínűleg a `scripts/generate-images.ts`-ben FLUX-szal, és a `public/images/...` mappában vannak).

**Lépések:**

1. **Nézd meg a meglévő két kártya-kép FLUX promptját** a kép-generáló scriptben (pl. `feature-creator`, `feature-brand` vagy hasonló nevű képek). Jegyezd meg a pontos stílust: világítás, háttérkezelés, színvilág, képkivágás, képarány, fájlformátum (webp), méret.

2. **Írj egy ÚJ FLUX promptot a harmadik képhez, ami STÍLUSBAN PONTOSAN ILLESZKEDIK** a meglévő kettőhöz — ugyanaz a vizuális nyelv, csak a téma más (kreatív szakember: kamera mögött álló operatőr / videóvágó a gépén / fotós kamerával).

   Kiindulási prompt-javaslat (igazítsd a meglévő képek stílusához!):

   > *"Professional Hungarian videographer behind a cinema camera and a video editor working on a laptop with a video timeline, modern creative studio, [IGAZÍTSD a meglévő két kép világításához és háttérkezeléséhez], lifestyle photography, matching the visual style and color treatment of the existing registration card illustrations, [UGYANAZ a képarány mint a meglévő kártya-képeknél]"*

   FONTOS: a stílust, világítást, színkezelést és képarányt a MEGLÉVŐ két képhez igazítsd, ne találj ki újat. Ha a meglévő képek pl. lime-os színezést vagy sötét hátteret használnak, a harmadik is azt kapja.

3. **Generáld le** a meglévő FLUX pipeline-nal (a már beállított Replicate integráció), és **mentsd ugyanabba a mappába, ugyanolyan névkonvencióval** (pl. `feature-professional.webp` vagy a meglévő minta szerint).

4. **Kösd be** a harmadik kártyába, ugyanúgy, ahogy a másik kettő be van kötve.

5. Ha a generált kép első nekifutásra nem illeszkedik jól a másik kettőhöz, **finomítsd a promptot és generáld újra**, amíg vizuálisan egységes nem lesz a három.

A `profileKind` minden esetben mentődjön a `creator_profiles` rekordba.

## C.2 UGC onboarding (meglévő, csak típus beállítás)

Ha `profileKind = "ugc"`, fusson a **meglévő** UGC onboarding wizard (bio, kategóriák, social linkek, feltöltött portfólió). **Rate card NINCS — ne add hozzá.** Csak annyi a változás, hogy a `profileKind` mentődjön `"ugc"`-ként.

## C.3 ÚJ — Kreatív szakember onboarding

Ha `profileKind = "professional"`, egy **egyszerűbb, portfólió-fókuszú** wizard fusson. Lépések:

### 1. lépés — Alapadatok
- Profilkép (kötelező)
- Megjelenített név (kötelező)
- Rövid bemutatkozás / bio (max 500 karakter)
- Lokáció (város + megye dropdown)

### 2. lépés — Szerepkör és szakterület
- **Szerepkör(ök)** (kötelező, min. 1, a `PROFESSIONAL_ROLES`-ból, **több is választható**):
  Videóvágó / Fotós / Operatőr
- **Szakterület chip-ek** (opcionális, a `SPECIALTY_SUGGESTIONS`-ből választható + saját is megadható):
  pl. Esküvő, Reklámfilm, Termékfotó

### 3. lépés — Portfólió (külső linkek)
- Min. 1, max. 15 portfólió elem.
- Minden elem: **link URL** (kötelező) + **cím** (opcionális).
- A link beillesztésekor **élő előnézet** jelenjen meg a `PortfolioEmbed` komponenssel (lásd Fázis B), hogy a felhasználó lássa, jól töltődik-e be.
- Mentéskor a `parseEmbedLink()`-kel számold ki az `embedType`-ot, és tárold a `portfolioItems` rekord `externalUrl` + `embedType` mezőiben.

**FONTOS UI-segítség (jelenítsd meg a portfólió lépésnél):**

> 💡 **Google Drive videó megosztása:** a videó megosztási beállítása legyen **"Bárki a link birtokában megtekintheti"**, különben az előnézet nem töltődik be. Másold be a videó megosztási linkjét (pl. `https://drive.google.com/file/d/.../view`).

### 4. lépés — Opcionális linkek + mentés
- Weboldal / Behance / Instagram URL (opcionális)
- "Profil mentése" → redirect a dashboardra

**NINCS rate card. NINCS követőszám-hangsúly** (a követőszám az UGC creatoré). Social linket megadhat opcionálisan, de nem hangsúlyos.

---

# FÁZIS D — KREATÍV SZAKEMBER PROFIL OLDAL

A meglévő `app/(public)/creators/[username]/page.tsx` oldalt tedd **típus-érzékennyé**:

- Ha `profileKind = "ugc"` → a **meglévő** UGC profil layout (rate card NÉLKÜL).
- Ha `profileKind = "professional"` → az **új, egyszerűbb** layout (lent).

## D.1 Szakember profil layout (4 szekció)

### 1. Hero
- Banner (vagy gradient fallback) + profilkép (kerek 120px)
- Név + lokáció
- **Szerepkör badge-ek** (lime színű): Videóvágó / Fotós / Operatőr
- "Üzenetet küldök" CTA gomb (a meglévő üzenetküldő modal)
- ★ rating (ha van értékelés)

### 2. Bemutatkozás
- Bio
- Szakterület chip-ek (`specialties`)
- Opcionális külső linkek (weboldal, Behance, Instagram) ikonokkal

### 3. Portfólió (a fő szekció!)
- A `portfolioItems` (ahol `externalUrl` ki van töltve) elemek **beágyazott előnézettel**, a `PortfolioEmbed` komponenssel.
- Rács: 2 oszlop desktopon, 1 mobilon (a videók nagyobbak, mint az UGC thumbnailek).
- Minden elem fölött a cím (ha van).

### 4. Értékelések
- Ugyanaz a meglévő review rendszer (Modell A), változtatás nélkül.

## D.2 Hasonló alkotók (alul)
- 3-4 ajánlás ugyanabból a típusból / szerepkörből.

---

# FÁZIS E — KÖZÖS DIRECTORY + TÍPUS-SZŰRŐ

A meglévő creator böngésző oldalt bővítsd egy **típus-szűrővel**. Egy directory marad, NE csinálj külön oldalakat.

## E.1 Típus-szűrő UI

A böngésző oldal tetejére (a meglévő szűrők mellé/fölé) tegyél egy **típus-választó sávot** (tab-ok vagy pill gombok a `DIRECTORY_TYPES`-ból):

```
[ Összes alkotó ]  [ UGC tartalomgyártó ]  [ Videóvágó ]  [ Fotós ]  [ Operatőr ]
```

Az aktív típus legyen lime háttérrel kiemelve. A választás szinkronizálódjon az URL-be (pl. `?tipus=editor`), hogy megosztható legyen.

## E.2 Szűrési logika

```typescript
// A kiválasztott típus alapján:
// "all"          -> nincs típus-szűrés
// "ugc"          -> profileKind = "ugc"
// "editor"       -> profileKind = "professional" ÉS professionalRoles tartalmazza "editor"
// "photographer" -> profileKind = "professional" ÉS professionalRoles tartalmazza "photographer"
// "videographer" -> profileKind = "professional" ÉS professionalRoles tartalmazza "videographer"
```

Drizzle-ben a `professionalRoles` (jsonb tömb) tartalmazás-szűréshez használd a megfelelő operátort (pl. `sql` helper a `@>` JSONB contains operátorral, vagy a Drizzle `arrayContains` ha alkalmazható a jsonb-re — ha nem, `sql` raw feltétel).

## E.3 Card megjelenítés típus szerint

A meglévő `CreatorCard` legyen típus-érzékeny:

- **UGC creator card** (meglévő): profilkép, név, IG/TikTok követőszám, kategória chip-ek.
- **Szakember card** (új): profilkép, név, lokáció, **szerepkör badge-ek** (Videóvágó/Fotós/Operatőr), szakterület chip-ek, ★ rating. **NE** mutass követőszámot.
- Mindkettőnél: "Profil megtekintése →" CTA, és featured esetén lime keret.

## E.4 Keresés és rendezés
- A meglévő szabad szöveges kereső a szakemberek nevére és bio-jára is működjön.
- A lokáció, kategória/szakterület és értékelés szűrők működjenek mindkét típusnál (ahol értelmezhető).

---

# FÁZIS F — NAVIGÁCIÓ ÉS APRÓSÁGOK

## F.1 Navbar dropdown

A fő navbarban a "Böngészés" (vagy "Alkotók") menüpont legyen egy dropdown a típusokkal:

```
Böngészés ▾
  ├─ Összes alkotó
  ├─ UGC tartalomgyártók
  ├─ Videóvágók
  ├─ Fotósok
  └─ Operatőrök
```

Mindegyik a böngésző oldalra visz, a megfelelő `?tipus=` paraméterrel.

## F.2 Hirdetésrendszer (kis igazítás)
- A brand hirdetés-feladásnál a "kit keresel" mezőhöz add hozzá a típus opciót (UGC / videóvágó / fotós / operatőr), hogy a megfelelő alkotók lássák.
- A creator hirdetés-feedben a szakember is pályázhat — a meglévő pályázási flow változatlan.

## F.3 Landing page
- A hero alatti rövid leírásban említsd meg, hogy nem csak UGC creatorok, hanem videóvágók, fotósok és operatőrök is vannak.

---

## ✋ ELLENŐRZÉSI PONT

Tesztelési forgatókönyv — fusson le mind:

- [ ] A Claude Code a FÁZIS 0-ban átnézte a meglévő projektet és összefoglalta a dizájnt/felépítést, mielőtt kódolni kezdett
- [ ] `npx tsc --noEmit` hibamentes
- [ ] Migration lefutott, a meglévő creatorok `profileKind = "ugc"` értéket kaptak
- [ ] A regisztrációs oldalon **HÁROM** gomb/kártya van: "Tartalomgyártó vagyok", "Videóvágó, Fotós, Operatőr vagyok", "Cégként regisztrálok"
- [ ] A harmadik (új) gomb **vizuálisan illeszkedik** a másik kettőhöz (méret, forma, stílus, hover)
- [ ] A harmadik gombhoz **legenerált kép** stílusban illeszkedik a meglévő két kártya-képhez
- [ ] A meglévő két gomb kinézete és működése NEM romlott el
- [ ] Szakember onboarding egyszerű (alapadatok → szerepkör → portfólió linkek), NINCS rate card
- [ ] Google Drive videó link beillesztésekor **megjelenik az előnézet** (iframe, /preview)
- [ ] YouTube és Vimeo link is beágyazva jelenik meg
- [ ] Egyéb (nem beágyazható) link kattintható "Megnyitás" gombként jelenik meg
- [ ] A szakember profil oldal a portfólió-fókuszú layoutot mutatja (NINCS rate card, NINCS követőszám)
- [ ] Az UGC profil a meglévő layoutot mutatja (rate card nélkül)
- [ ] A directory típus-szűrő működik (Összes / UGC / Videóvágó / Fotós / Operatőr)
- [ ] A típus-szűrő szinkronizálva van az URL-lel (`?tipus=...`)
- [ ] A szakember card NEM mutat követőszámot, de mutat szerepkör badge-eket
- [ ] A navbar dropdown a típusokra ugrik
- [ ] A meglévő UGC flow, brand flow, böngésző, profil, hirdetés és fizetés VÁLTOZATLANUL működik
- [ ] Mobil nézet rendben (a beágyazott videók reszponzívak, 16:9 arány; 3 kártya 1 oszlopban mobilon)

**Ha mind ✓:** kész a kiegészítés. Ha hibát találsz, jelezd, és javítom.

---

## 📌 ÖSSZEFOGLALÓ A FELHASZNÁLÓNAK (NEKED)

Amit ez a prompt hozzáad a kész oldalhoz:

1. **Először átnézi a kész oldalt:** a Claude Code a kódolás előtt végignézi a meglévő projektet, és ahhoz illeszti a dizájnt — nem rontja el a működő felületet.
2. **Új gomb a regisztrációs oldalon:** "Videóvágó, Fotós, Operatőr vagyok" — a másik kettőhöz illeszkedő kinézettel és **automatikusan legenerált, stílusban egyező képpel**.
3. **Új profil-típus:** UGC tartalomgyártó (meglévő) mellett **Kreatív szakember** (videóvágó / fotós / operatőr).
4. **Egyszerűbb adatlap a szakembereknek:** csak portfólió, külső linkekkel — nincs rate card, nincs követőszám.
5. **Drive/YouTube/Vimeo előnézet:** ha a szakember egy Google Drive videó linket ad meg, az **beágyazva, lejátszhatóan** jelenik meg a profilján. (Fontos: a Drive videó megosztása "Bárki a link birtokában" legyen.)
6. **Egy közös directory, típus-szűrővel:** Összes / UGC / Videóvágó / Fotós / Operatőr — egy helyen, nincs szétaprózva.

*Creatorz.hu — Kiegészítő prompt · 2026*
