import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const firstName = process.env.SEED_ADMIN_FIRSTNAME;
const lastName = process.env.SEED_ADMIN_LASTNAME;
const phone = process.env.SEED_ADMIN_PHONE ?? "";

if (!url || !secretKey || !email || !password || !firstName || !lastName) {
  console.error(
    "Missing env vars: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_ADMIN_EMAIL, " +
      "SEED_ADMIN_PASSWORD, SEED_ADMIN_FIRSTNAME and SEED_ADMIN_LASTNAME.",
  );
  process.exit(1);
}

if (secretKey.startsWith("sb_publishable_")) {
  console.error("SUPABASE_SECRET_KEY holds the publishable key. Use the secret key.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
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
    // Read by the on_auth_user_created trigger to fill the profile's contact details.
    user_metadata: { first_name: firstName, last_name: lastName, phone },
    // Read by the trigger to set profiles.role. Only the server can write app_metadata.
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
  console.log(`  id:    ${data.user.id}`);
  console.log(`  name:  ${firstName} ${lastName}`);
  console.log(`  email: ${email}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`  password: ${password}`);
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});