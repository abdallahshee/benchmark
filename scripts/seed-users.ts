
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
    throw new Error(
        "Missing env vars: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
}

if (secretKey.startsWith("sb_publishable_")) {
    throw new Error(
        "SUPABASE_SECRET_KEY holds the publishable key. Use the secret key.",
    );
}

const supabase = createClient(url, secretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
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

const SITE_NAME = "Riverside Apartments";

const ONE_PER_SCOPE: SeedRole[] = [
    "admin",
    "foreman",
    "secretary",
];

// Development accounts only.
// Change these passwords before using the application in production.
const USERS: SeedUser[] = [
    {
        role: "admin",
        email: "admin.example@gmail.com",
        password: "Admin@2026",
        firstName: "Abdallah",
        lastName: "Shee",
        phone: "0796515302",
    },
    {
        role: "foreman",
        email: "foreman.example@gmail.com",
        password: "Foreman@2026",
        firstName: "Developer",
        lastName: "Morgan",
        phone: "0747515302",
    },
    {
        role: "secretary",
        email: "secretary.example@gmail.com",
        password: "Secretary@2026",
        firstName: "Amina",
        lastName: "Wanjiru",
        phone: "0712345678",
    },
    {
        role: "worker",
        email: "worker.example@example.com",
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

    if (found) {
        console.log(`Using existing site "${name}".`);
        return found.id;
    }

    const { data: created, error: createError } = await supabase
        .from("sites")
        .insert({
            name,
            status: "active",
        })
        .select("id")
        .single();

    if (createError) throw createError;

    console.log(`Created site "${name}".`);

    return created.id;
}

async function findExistingUser(
    email: string,
): Promise<string | null> {
    const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (error) throw error;

    const user = data.users.find(
        (item) => item.email?.toLowerCase() === email.toLowerCase(),
    );

    return user?.id ?? null;
}

async function assignProfile(
    userId: string,
    user: SeedUser,
    siteId: string,
): Promise<void> {
    const onSite = user.role !== "admin";

    const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("id, role, site_id")
        .eq("id", userId)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (!profile) {
        throw new Error(
            `Profile not found for ${user.email}. Check the auth user creation trigger.`,
        );
    }

    if (ONE_PER_SCOPE.includes(user.role)) {
        const { data: existing, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", user.role)
            .eq("site_id", siteId)
            .neq("id", userId)
            .limit(1);

        if (error) throw error;

        if (existing && existing.length > 0) {
            console.log(
                `Another ${user.role} already exists on this site. Skipping profile update for ${user.email}.`,
            );
            return;
        }
    }

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            role: user.role,
            site_id: onSite ? siteId : null,
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone,
        })
        .eq("id", userId);

    if (updateError) throw updateError;

    console.log(
        `Updated ${user.role} profile: ${user.email}.`,
    );
}

async function createSeedUser(
    user: SeedUser,
    siteId: string,
): Promise<void> {
    const label = `${user.role} ${user.firstName} ${user.lastName}`;

    const existingId = await findExistingUser(user.email);

    if (existingId) {
        console.log(`${user.email} already exists. Checking profile.`);

        await assignProfile(existingId, user, siteId);

        return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,

        user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone,
        },

        app_metadata: {
            role: user.role,
        },
    });

    if (error) throw error;

    // The auth trigger should create the profile.
    // Then assign the site and confirm the profile.
    await assignProfile(data.user.id, user, siteId);

    console.log(
        `Created ${label} <${user.email}>${user.role !== "admin" ? ` on "${SITE_NAME}"` : ""}.`,
    );
}

export async function runUserSeed(): Promise<string> {
    console.log("\n--- SEEDING USERS ---\n");

    const siteId = await ensureSite(SITE_NAME);

    for (const user of USERS) {
        await createSeedUser(user, siteId);
    }

    console.log("\nUser seeding completed.");

    return siteId;
}
