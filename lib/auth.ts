
import "server-only";

import { eq } from "drizzle-orm";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { CurrentUser, profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Role } from "@/types/user";

// Signed-in user and their role, read from the database.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const [profile] = await db
    .select({
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      siteId: profiles.siteId,
      role: profiles.role,
      status: profiles.status,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    siteId: profile?.siteId ?? null,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
  };
});

// For pages: requires authentication.
export async function requireUser(next: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/?next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser?.app_metadata?.must_change_password) {
    redirect("/change-password");
  }

  return user;
}

// For pages and Server Actions: requires an allowed role.
export async function requireRole(...roles: Role[]) {
  const user = await requireUser("/");

  if (!user.role || !roles.includes(user.role)) {
    forbidden();
  }

  return user as CurrentUser & { role: Role };
}

// Specifically for the change-password page.
export async function requirePasswordChangeUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  if (!user.app_metadata?.must_change_password) {
    redirect("/");
  }

  return user;
}
