"use server";
import { and, eq } from "drizzle-orm";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import type { SiteRole } from "@/lib/site-roles";
import { profiles, reports, sites } from "@/db/schema";

import { asc, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { authErrorMessage } from "@/lib/supabase/errors";

import { authUsers } from "drizzle-orm/supabase";

import type { Role } from "@/types/user";
import { db } from "@/db";
import { isUuid } from "@/lib/helper";
// import { InviteSiteUserRequest } from "@/forms/user-forms";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };
import { InviteInput, InviteInputSchema, InviteSiteUserRequest } from "@/forms/user-forms";

async function inviteSiteUser(input: InviteInput, role: SiteRole): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = InviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { siteId, password, firstName, lastName, email, phone } = parsed.data;

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);

  if (!site) {
    return { ok: false, error: "Site not found" };
  }

  // Check whether this particular role is already assigned.
  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        eq(profiles.siteId, siteId),
        eq(profiles.role, role),
      ),
    )
    .limit(1);

  if (taken) {
    return {
      ok: false,
      error: `This site already has a ${role}.`,
    };
  }

  const admin = createAdminClient();
  const siteUrl = await getSiteUrl();

const { data, error } = await admin.auth.admin.inviteUserByEmail(
  email,
  {
    data: {
      first_name: firstName,
      last_name: lastName,
      phone,
    },
    redirectTo: `${siteUrl}/auth/confirm?next=/change-password`,
  },
);

if (error) {
  return {
    ok: false,
    error: authErrorMessage(error, "invite"),
  };
}

const userId = data.user.id;

// Assign temporary password and account metadata.
const { error: updateError } =
  await admin.auth.admin.updateUserById(userId, {
    password,
    app_metadata: {
      role,
      must_change_password: true,
    },
  });

if (updateError) {
  await admin.auth.admin.deleteUser(userId);

  return {
    ok: false,
    error: "Could not configure the account. Please try again.",
  };
}

  // Assign the site and role to the profile.
  try {
    const updated = await db
      .update(profiles)
      .set({
        siteId,
        firstName,
        lastName,
        phone,
        role,
      })
      .where(eq(profiles.id, userId))
      .returning({ id: profiles.id });

    if (updated.length === 0) {
      throw new Error("Profile row is missing");
    }
  } catch {
    await admin.auth.admin.deleteUser(userId);

    return {
      ok: false,
      error: "Could not assign the user to the site. Please try again.",
    };
  }

  revalidatePath(`/admin/sites/${siteId}`);
  revalidatePath(`/admin/sites/${siteId}/users`);
  revalidatePath("/admin/sites");
  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return {
    ok: true,
    message: `Invitation sent to ${email}`,
  };
}

// Only this action can invite a foreman.
export async function inviteForeman(input: InviteInput): Promise<ActionResult> {
  return inviteSiteUser(input, "foreman");
}

export async function inviteSecretary(input: InviteInput): Promise<ActionResult> {
  return inviteSiteUser(input, "secretary");
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




export type CreateUserInput = InviteSiteUserRequest &{
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


// One user with their profile, site and a little activity. Returns null for a malformed or
// unknown id. This function does NOT check access: callers must call requireRole() first.
export async function getUserById(id: string) {
  if (!isUuid(id)) return null; // A malformed ID would make Postgres throw

  const [user] = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      role: profiles.role,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      email: authUsers.email,
      lastSignInAt: authUsers.lastSignInAt,
      siteId: sites.id,
      siteName: sites.name,

      // Plain SQL so Drizzle can't drop the table prefix inside the subqueries.
      reportCount: sql<number>`
        (
          select count(*)::int
          from ${reports} r
          where r.created_by = ${profiles}.id
        )
      `,

      // Epoch milliseconds, so the value is a plain number.
      lastReportAt: sql<number | null>`
        (
          select (extract(epoch from max(r.created_at)) * 1000)::double precision
          from ${reports} r
          where r.created_by = ${profiles}.id
        )
      `,
    })
    .from(profiles)
    .innerJoin(authUsers, eq(authUsers.id, profiles.id))
    .leftJoin(sites, eq(sites.id, profiles.siteId))
    .where(eq(profiles.id, id))
    .limit(1);

  return user ?? null;
}

export type UserDetails = NonNullable<Awaited<ReturnType<typeof getUserById>>>;
// export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];
export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];


