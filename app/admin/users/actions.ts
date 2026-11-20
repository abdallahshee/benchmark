"use server";

import { eq} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { isRole } from "@/lib/roles";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { authErrorMessage } from "@/lib/supabase/errors";
import { CreateUserInput, Role } from "@/types/user";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function inviteUser(input: {
  email: string;
  fullName: string;
  role: Role;
}): Promise<ActionResult> {
  await requireRole("admin");

  const siteUrl = await getSiteUrl();
  const { data, error } = await createAdminClient().auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.fullName },
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
  await db.update(profiles).set({ role:input.role, fullName:input.fullName }).where(eq(profiles.id, data.user.id));

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


export async function createUser({ email, password, fullName, role }: CreateUserInput) {
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    // Read by the on_auth_user_created trigger to set profiles.role.
    app_metadata: { role },
  });

  revalidatePath("/admin/users");

  if (error) {
    console.error("Failed to create user:", error.message);
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}
