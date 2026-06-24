// Egyszeri migráció: kötelező onboarding-befejezés jelző.
//   - creator_profiles.onboarding_completed boolean
//   - backfill: a MÁR teljes profilokat true-ra állítjuk (őket nem zaklatjuk),
//     a befejezetlen (placeholder) profilok false maradnak → legközelebbi
//     belépéskor az onboardingra irányítjuk őket, hogy megadják a nevüket stb.
// Futtatás:  node --env-file=.env.local scripts/migrate-onboarding-gate.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false`;

  // UGC: akkor kész, ha van nem, születési dátum és legalább 1 kategória.
  // Professional: akkor kész, ha van legalább 1 szerepkör.
  const res = await sql`
    UPDATE creator_profiles SET onboarding_completed = true
    WHERE
      (profile_kind = 'ugc'
        AND gender IS NOT NULL
        AND birth_date IS NOT NULL
        AND coalesce(jsonb_array_length(categories), 0) > 0)
      OR
      (profile_kind = 'professional'
        AND coalesce(jsonb_array_length(professional_roles), 0) > 0)
  `;
  console.log(`✓ onboarding_completed kész — ${res.count} meglévő (teljes) profil jelölve késznek`);
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
