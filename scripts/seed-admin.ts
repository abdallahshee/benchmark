import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_ROLE ?? "Admin";

if (!url || !serviceKey || !email || !password) {
  console.error("Missing env vars: need Supabase URL, service role key, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Skip if an admin already exists, so the script is safe to run repeatedly.
  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (lookupError) throw lookupError;
  if (existing && existing.length > 0) {
    console.log("An admin already exists, skipping.");
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    // Read by the on_auth_user_created trigger to set profiles.role.
    app_metadata: { role: "admin" },
  });

  if (error) {
    if (error.code === "email_exists") {
      console.log("A user with this email already exists, skipping.");
      return;
    }
    throw error;
  }

console.log("Admin created successfully:");
console.log(`  id:       ${data.user.id}`);
console.log(`  email:    ${email}`);
console.log(`  password: ${password}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});