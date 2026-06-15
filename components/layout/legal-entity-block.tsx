import { getLegalEntity } from "@/lib/settings";

/**
 * Adatkezelő-blokk — az aktuális jogi adatok (settings DB-ből) alapján
 * renderelődik. Élesedéskor (magánszemély → EV → KFT) az admin-ról bármikor
 * frissíthető, és az összes jogi oldal automatikusan átveszi.
 */
export async function LegalEntityBlock() {
  const e = await getLegalEntity();
  return (
    <ul>
      <li>
        <strong>{e.label}:</strong> {e.name}
      </li>
      <li>
        <strong>Székhely / cím:</strong> {e.address}
      </li>
      <li>
        <strong>Email:</strong> {e.email}
      </li>
      {e.type === "ev" && (
        <>
          {e.taxId && (
            <li>
              <strong>Adószám:</strong> {e.taxId}
            </li>
          )}
          {e.evRegNumber && (
            <li>
              <strong>Egyéni vállalkozói nyilvántartási szám:</strong>{" "}
              {e.evRegNumber}
            </li>
          )}
        </>
      )}
      {e.type === "kft" && (
        <>
          {e.taxId && (
            <li>
              <strong>Adószám:</strong> {e.taxId}
            </li>
          )}
          {e.kftCourt && (
            <li>
              <strong>Cégbíróság:</strong> {e.kftCourt}
            </li>
          )}
          {e.kftRegNumber && (
            <li>
              <strong>Cégjegyzékszám:</strong> {e.kftRegNumber}
            </li>
          )}
        </>
      )}
      {e.naihId && (
        <li>
          <strong>NAIH bejelentési szám:</strong> {e.naihId}
        </li>
      )}
    </ul>
  );
}
