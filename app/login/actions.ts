"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/supabase/errors";
import { Role, ROLE_LABELS } from "@/types/user";

export type AuthState = { error?: string } | undefined;

export type Credentials = { email: string; password: string; next?: string };

// Server Actions are public endpoints: don't trust the argument's shape.
function readCredentials(input: Credentials) {
  return {
    email: String(input?.email ?? ""),
    password: String(input?.password ?? ""),
  };
}
import { eq } from "drizzle-orm";


import { db } from "@/db";
import { profiles } from "@/db/schema";

import { safeRedirectPath } from "@/lib/safe-redirect";


export async function signIn(input: Credentials): Promise<AuthState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(readCredentials(input));
  if (error) return { error: authErrorMessage(error, "sign-in") };

  // Read the role from the database, as getCurrentUser() does. A missing profile row
  // gives undefined instead of an error.
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, data.user.id))
    .limit(1);

  const home = profile?.role ? ROLE_LABELS[profile.role] : undefined;

  // No role (or an unknown one): the account can sign in but can't access anything.
  if (!home) {
    await supabase.auth.signOut();
    return { error: "Your account has no role assigned yet. Please contact an administrator." };
  }

  // Go back to the page they were sent from, but only if it is inside their own area.
  // Otherwise a worker following a link to /admin would be bounced by the proxy.
  const next = input?.next ? safeRedirectPath(input.next) : null;
  const inOwnArea = next && (next === home || next.startsWith(`${home}/`));

  redirect(inOwnArea ? next : home);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

