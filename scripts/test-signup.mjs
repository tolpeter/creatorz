import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const email = process.argv[2] || `probe-${Date.now()}@example.com`;
const { data, error } = await supabase.auth.signUp({
  email,
  password: "CreatorTest1234",
});

console.log("email:", email);
console.log("error:", error ? { message: error.message, status: error.status, code: error.code } : null);
console.log("user id:", data?.user?.id ?? null);
console.log("session:", data?.session ? "van (auto-confirm)" : "nincs (confirm szükséges)");
