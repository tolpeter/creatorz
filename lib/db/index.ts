import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// HMR-biztos kliens: fejlesztésben a Next.js hot-reload újraértékeli ezt a
// modult, és minden alkalommal új postgres() poolt nyitna — a régiek nyitva
// maradnának, így pillanatok alatt kimerítenék a Supabase pooler kapcsolat-
// limitjét. A globalThis-en cache-elve egyetlen poolt használunk újra.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

// Disable prefetch as it is not supported for "Transaction" pool mode.
// max: 10 — bőven elég a serverless/dev igényekhez, nem terheli túl a poolert.
// Rezíliencia: a beragadt/elavult kapcsolatok automatikus újrahasznosítása,
// hogy egy átmeneti pooler-akadás ne ragassza be véglegesen az appot.
//  - connect_timeout: ennyi mp után feladja a kapcsolódást (nem lóg örökké)
//  - idle_timeout:    a tétlen kapcsolatokat lezárja és újranyitja
//  - max_lifetime:    a kapcsolatokat rendszeresen frissre cseréli
const client =
  globalForDb.__pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    connect_timeout: 15,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });

export * from "./schema";
