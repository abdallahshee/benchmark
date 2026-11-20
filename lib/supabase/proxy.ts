import { Role } from "@/types/user";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole } from "../roles";


// Routes that require a signed-in user.
const PROTECTED_PREFIXES = ["/account", "/admin"];
// Routes restricted to certain roles. This is a fast first gate using the `user_role`
// JWT claim; pages and Server Actions re-check the role with requireRole().
const ROLE_PREFIXES: [prefix: string, roles: Role[]][] = [["/admin", ["admin"]]];
// Routes only for signed-out users; signed-in users are sent to /account.
const AUTH_ROUTES = ["/login"];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(prefix + "/");

// Refreshes the Supabase session cookie and guards protected routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Cache-control headers that stop CDNs caching auth cookies.
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Don't run code between createServerClient and getClaims():
  // getClaims() validates the JWT and refreshes the session if needed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  if (!user && PROTECTED_PREFIXES.some((p) => matches(pathname, p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed/cleared auth cookies on the redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Only enforced when the claim is present (i.e. the access token hook is enabled);
  // otherwise the page's own requireRole() check decides.
  const claimRole = user?.role;
  const required = ROLE_PREFIXES.find(([p]) => matches(pathname, p))?.[1];
  if (user && required && claimRole !== undefined) {
    if (!isRole(claimRole) || !required.includes(claimRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    }
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Return `response` as-is so the refreshed cookies reach the browser.
  return response;
}
