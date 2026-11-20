"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";


import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { authErrorMessage } from "@/lib/supabase/errors";


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
  const { error } = await supabase.auth.signInWithPassword(readCredentials(input));
  if (error) return { error: authErrorMessage(error, "sign-in") };

  redirect(safeRedirectPath(input?.next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

