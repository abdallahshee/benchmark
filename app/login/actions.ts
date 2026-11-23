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



export async function signIn(input: Credentials): Promise<AuthState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(readCredentials(input));
  if (error) return { error: authErrorMessage(error, "sign-in") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const home = ROLE_LABELS[profile?.role as Role];

  // No role (or an unknown one): the account can sign in but can't access anything.
  if (!home) {
    await supabase.auth.signOut();
    return { error: "Your account has no role assigned yet. Please contact an administrator." };
  }

  redirect("/admin/users");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

