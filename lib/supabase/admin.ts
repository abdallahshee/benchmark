import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client for admin operations (inviting/deleting users).
// It bypasses RLS: only use it after requireRole("admin"), and never in client code.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set (needed for user management)");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
