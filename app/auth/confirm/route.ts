import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// Handles links from Supabase auth emails (sign-up confirmation, magic link, password reset).
// Requires the email templates to link to:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=...
// The default PKCE "?code=" links are handled too.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  redirect("/?error=confirmation_failed");
}
