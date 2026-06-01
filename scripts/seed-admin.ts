import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db/index";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = "admin@videmark.hu";
const password = "Teszt1234";

async function main() {
  await db.delete(users).where(eq(users.email, email));
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });
  if (error) throw new Error(error.message);

  await db.insert(users).values({ authId: data.user!.id, email, role: "admin", approved: true });
  console.log("✅ Admin kész → admin@videmark.hu / Teszt1234");
}

main()
  .catch((e) => {
    console.error("❌", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
