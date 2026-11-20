import "server-only";

import { type AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the authentication server. Check your connection and try again.";

// supabase-js reports network failures (DNS, connect timeout, connection reset)
// as AuthRetryableFetchError with status 0 and a bare "fetch failed" message.
export function isNetworkError(error: AuthError) {
  return isAuthRetryableFetchError(error) && error.status === 0;
}

// Logs the underlying cause server-side (it's hidden from the user) and returns a
// user-friendly message.
export function authErrorMessage(error: AuthError, context: string) {
  if (isNetworkError(error)) {
    console.error(`[auth] ${context}: network error talking to Supabase:`, error.message, error.cause ?? "");
    return NETWORK_ERROR_MESSAGE;
  }
  console.error(`[auth] ${context}:`, error.status, error.code, error.message);
  return error.message;
}
