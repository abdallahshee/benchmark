"use server";

import { and, asc, eq, ilike, isNull, ne, or, sql} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles, sites } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { getSiteUrl } from "@/lib/site-url";

import { authErrorMessage } from "@/lib/supabase/errors";

import { authUsers } from "drizzle-orm/supabase";
import { createAdminClient } from "@/lib/supabase/admin"; // adjust to your path
import type { Role } from "@/types/user";
import z from "zod"
export type ActionResult = { ok: true; message: string } | { ok: false; error: string };


// Keep the role list in sync with ROLES. Admins are never created through this form.
const inviteSchema = z.object({
  siteId: z.string(),
  firstName: z.string().trim().min(1, "Enter a first name").max(60),
  lastName: z.string().trim().min(1, "Enter a last name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().regex(/^(\+?[0-9\s-]{7,15})?$/, "Enter a valid phone number"),
  role: z.enum(["foreman", "secretary"]),
});

export async function inviteSiteUser(input: {
  siteId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "foreman" | "secretary";
}): Promise<ActionResult> {
  await requireRole("admin"); // actions are public endpoints, so check first

  // Don't trust the argument's shape.
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { siteId, firstName, lastName, email, phone, role } = parsed.data;

  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) return { ok: false, error: "Site not found" };

  // A site has one foreman and one secretary. The unique indexes enforce it as well.
  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.siteId, siteId), eq(profiles.role, role)))
    .limit(1);
  if (taken) return { ok: false, error: `This site already has a ${role}.` };

  const admin = createAdminClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    // snake_case keys: the signup trigger reads these to fill the profile.
    data: { first_name: firstName, last_name: lastName, phone },
    redirectTo: `${siteUrl}/auth/confirm?next=/set-password`,
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { ok: false, error: "A user with this email already exists" };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { ok: false, error: "Email rate limit reached. Try again later." };
    }
    return { ok: false, error: authErrorMessage(error, "invite") };
  }
  const userId = data.user.id;

  // The role has to live in app_metadata too (the proxy reads it), and an invite can't
  // set it, so it is written right after. Don't leave a half-set-up account behind.
  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (metaError) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "Could not set up the account. Please try again." };
  }

  // The trigger already created the profile; give it its role and its site.
  try {
    const updated = await db
      .update(profiles)
      .set({ role, siteId, firstName, lastName, phone })
      .where(eq(profiles.id, userId))
      .returning({ id: profiles.id });
    if (updated.length === 0) throw new Error("Profile row is missing");
  } catch {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "Could not assign the user to the site. Please try again." };
  }

  revalidatePath(`/admin/sites/${siteId}`);
  revalidatePath("/admin/sites");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: `Invitation sent to ${email}` };
}

export async function changeRole(userId: string, role: Role): Promise<ActionResult> {
  await requireRole("admin");
  
  const updated = await db
    .update(profiles)
    .set({ role })
    .where(eq(profiles.id, userId))
    .returning({ id: profiles.id });
  if (updated.length === 0) return { ok: false, error: "User not found" };

  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated" };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const admin = await requireRole("admin");
  // Deleting the auth user cascades to the profile.
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: authErrorMessage(error, "delete user") };

  revalidatePath("/admin/users");
  return { ok: true, message: "User deleted" };
}




export type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
};

export async function createUser({
  email,
  password,
  firstName,
  lastName,
  phone,
  role,
}: CreateUserInput) {
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // Read by the on_auth_user_created trigger to fill first_name, last_name and phone.
    user_metadata: { first_name: firstName, last_name: lastName, phone: phone || null },
    // Read by the trigger to set profiles.role. Only the server can write app_metadata.
    app_metadata: { role },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    return { user: null, error: error.message };
  }

  revalidatePath("/admin/users");
  return { user: data.user, error: null };
}

// Every user except admins, oldest first. Users with no role yet are included, so a
// new account waiting for a role can still be seen and assigned one.
// This function does NOT check access: callers must call requireRole() first.

// % and _ are wildcards in LIKE, so a search for "100%" must not match everything.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// Every user except admins, oldest first. With `search`, only users whose email or phone
// contains the text (case-insensitive). This function does NOT check access: callers
// must call requireRole() first.
export async function getUsers({ search }: { search?: string } = {}) {
  const conditions = [or(isNull(profiles.role), ne(profiles.role, "admin"))];

  if (search) {
    const term = `%${escapeLike(search)}%`;
    const matches = [ilike(authUsers.email, term), ilike(profiles.phone, term)];

    // A number typed as "0796 515 302" or "+254-796" should still find the stored
    // phone whatever its spacing, so also compare digits only.
    if (/^[\d\s+()-]+$/.test(search)) {
      const digits = search.replace(/\D/g, "");
      if (digits) {
        matches.push(
          sql`regexp_replace(${profiles.phone}, '[^0-9]', '', 'g') like ${`%${digits}%`}`,
        );
      }
    }
    conditions.push(or(...matches));
  }

  const rows = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      role: profiles.role,
      email: authUsers.email,
      lastSignInAt: authUsers.lastSignInAt,
    })
    .from(profiles)
    .innerJoin(authUsers, eq(authUsers.id, profiles.id))
    .where(and(...conditions))
    .orderBy(asc(profiles.createdAt));

  // Dates become strings so the rows can be passed to a Client Component.
  return rows.map((r) => ({ ...r, lastSignInAt: r.lastSignInAt?.toISOString() ?? null }));
}

// export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];
export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];