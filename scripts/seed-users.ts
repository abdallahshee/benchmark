import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing env vars: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  process.exit(1);
}

if (secretKey.startsWith("sb_publishable_")) {
  console.error("SUPABASE_SECRET_KEY holds the publishable key. Use the secret key.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SeedRole = "admin" | "foreman" | "secretary" | "worker";

type SeedUser = {
  role: SeedRole;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

// The site the foreman, secretary and worker belong to. It is created if it doesn't exist.
const SITE_NAME = "Riverside Apartments";

// Roles with only one person per scope: one admin, and one foreman and one secretary
// per site. A site can have many workers, so workers are checked by email only.
const ONE_PER_SCOPE: SeedRole[] = ["admin", "foreman", "secretary"];

// Development accounts only. Change all of these passwords after the first sign-in.
const USERS: SeedUser[] = [
  {
    role: "admin",
    email: "abdallahshee664@gmail.com",
    password: "Shee@1234",
    firstName: "Abdallah",
    lastName: "Shee",
    phone: "0796515302",
  },
  {
    role: "foreman",
    email: "developershee@gmail.com",
    password: "Morgan@2026",
    firstName: "Developer",
    lastName: "Morgan",
    phone: "0747515302",
  },
  {
    role: "secretary",
    email: "amina.wanjiru@example.com",
    password: "Secretary@2026",
    firstName: "Amina",
    lastName: "Wanjiru",
    phone: "0712345678",
  },
  {
    role: "worker",
    email: "joseph.otieno@example.com",
    password: "Worker@2026",
    firstName: "Joseph",
    lastName: "Otieno",
    phone: "0722334455",
  },
];

async function ensureSite(name: string): Promise<string> {
  const { data: found, error: lookupError } = await supabase
    .from("sites")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (found) return found.id as string;

  const { data: created, error: createError } = await supabase
    .from("sites")
    .insert({ name, status: "active" })
    .select("id")
    .single();
  if (createError) throw createError;

  console.log(`Created site "${name}".`);
  return created.id as string;
}

async function seedUser(user: SeedUser, siteId: string) {
  const label = `${user.role} ${user.firstName} ${user.lastName}`;
  const onSite = user.role !== "admin";

  if (ONE_PER_SCOPE.includes(user.role)) {
    const check = supabase.from("profiles").select("id").eq("role", user.role).limit(1);
    const { data: existing, error: lookupError } = await (onSite
      ? check.eq("site_id", siteId)
      : check);
    if (lookupError) throw lookupError;
    if (existing && existing.length > 0) {
      console.log(`A ${user.role} already exists${onSite ? " on this site" : ""}, skipping ${label}.`);
      return;
    }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    // Read by the on_auth_user_created trigger to fill the profile's contact details.
    user_metadata: { first_name: user.firstName, last_name: user.lastName, phone: user.phone },
    // Read by the trigger to set profiles.role. Only the server can write app_metadata.
    app_metadata: { role: user.role },
  });

  if (error) {
    if (error.code === "email_exists") {
      console.log(`${user.email} already exists, skipping ${label}.`);
      return;
    }
    throw error;
  }

  if (onSite) {
    // Put the new user on the site. If this fails, remove the account again so a rerun
    // starts clean instead of hitting "email already exists".
    const { data: assigned, error: assignError } = await supabase
      .from("profiles")
      .update({ site_id: siteId })
      .eq("id", data.user.id)
      .select("id");

    if (assignError || !assigned || assigned.length === 0) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw assignError ?? new Error("The profile row is missing. Is the signup trigger installed?");
    }
  }

  console.log(`Created ${label} <${user.email}>${onSite ? ` on "${SITE_NAME}"` : ""}.`);
}

async function main() {
  const siteId = await ensureSite(SITE_NAME);

  // One at a time, so the output stays in order and one failure stops the rest.
  for (const user of USERS) {
    await seedUser(user, siteId);
  }

  console.log("Seeding finished.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});