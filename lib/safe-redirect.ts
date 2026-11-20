// Only allow same-origin relative paths, to prevent open redirects.
export function safeRedirectPath(next: unknown, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
