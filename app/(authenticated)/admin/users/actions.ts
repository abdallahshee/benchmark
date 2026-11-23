"use server";

import { asc, eq, isNull, ne, or} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { getSiteUrl } from "@/lib/site-url";

import { authErrorMessage } from "@/lib/supabase/errors";

import { authUsers } from "drizzle-orm/supabase";
import { createAdminClient } from "@/lib/supabase/admin"; // adjust to your path
import type { Role } from "@/types/user";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function inviteUser(input: {
  email: string;
  firstName: string;
  lastName:string;
  phone:string,
  role: Role;
}): Promise<ActionResult> {
  await requireRole("admin");

  const siteUrl = await getSiteUrl();
  const { data, error } = await createAdminClient().auth.admin.inviteUserByEmail(input.email, {
    data: { firstName: input.firstName,lastName:input.lastName,phone:input.phone },
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

  // The on_auth_user_created trigger has already created the profile; set its role.
  await db.update(profiles).set({ role:input.role, firstName:input.firstName,lastName:input.lastName,phone:input.phone }).where(eq(profiles.id, data.user.id));

  revalidatePath("/admin/users");
  return { ok: true, message: `Invitation sent to ${input.email}` };
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
export async function getUsers() {
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
    .where(or(isNull(profiles.role), ne(profiles.role, "admin")))
    .orderBy(asc(profiles.createdAt));

  // Dates become strings so the rows can be passed to a Client Component.
  return rows.map((r) => ({ ...r, lastSignInAt: r.lastSignInAt?.toISOString() ?? null }));
}

export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];