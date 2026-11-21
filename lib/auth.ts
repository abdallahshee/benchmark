import "server-only";

import { eq } from "drizzle-orm";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { CurrentUser, profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {  Role } from "@/types/user";

// The signed-in user and their role, read from the database (not the JWT), so role
// changes apply immediately. Cached for the duration of a single request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const [profile] = await db
    .select({ fullName: profiles.fullName,siteId:profiles.siteId, role: profiles.role,updatedAt:profiles.updatedAt })
    .from(profiles)
    .where(eq(profiles.id, claims.sub))
    .limit(1);

  return {
    id: claims.sub!,
    siteId:profile.siteId??null,
    email: claims.email,
    fullName: profile?.fullName ?? null,
    role: profile?.role ?? null,
    createdAt:profile?.updatedAt
  };
});

// For pages: redirects to /login when signed out.
export async function requireUser(next :string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// For pages and Server Actions: 403 unless the user has one of the given roles.
// Always call this at the top of every Server Action that needs a role; actions are
// public endpoints and the proxy alone does not protect them.
export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.role || !roles.includes(user.role)) forbidden();
  return user as CurrentUser & { role: Role };
}
