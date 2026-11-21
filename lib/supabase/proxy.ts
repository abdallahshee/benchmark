import { Role } from "@/types/user";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole } from "../roles";

// Where each role lands, and the only area it may use.
// Record<Role, string> makes TypeScript complain if you add a role and forget it here.
const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  secretary: "/secretary",
  foreman: "/foreman",
  worker:"/worker"
};

// Routes restricted to certain roles. A fast first gate; pages and Server Actions
// still re-check with requireRole(). To let admins into every area, add "admin"
// to the other lists.
const ROLE_PREFIXES: [prefix: string, roles: Role[]][] = [
  ["/admin", ["admin"]],
  ["/secretary", ["secretary"]],
  ["/foreman", ["foreman"]],
];

// Every role-restricted prefix also requires a signed-in user.
const PROTECTED_PREFIXES = ROLE_PREFIXES.map(([prefix]) => prefix);

// Routes only for signed-out users.
const AUTH_ROUTES = ["/login"];

// Signed-in users without a role land here. Must not be in PROTECTED_PREFIXES
// or AUTH_ROUTES, or you get a redirect loop.
const NO_ACCESS = "/no-access";

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

  // Redirect while keeping any refreshed/cleared auth cookies.
  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  // The app role lives in app_metadata (written server-side by the trigger and the
  // seed script). The top-level `role` claim is the Postgres role ("authenticated").
  const rawRole = (user?.app_metadata as { role?: unknown } | undefined)?.role;
  const role: Role | null = isRole(rawRole) ? rawRole : null;

  const { pathname } = request.nextUrl;

  // 1. Signed out on a protected route.
  if (!user && PROTECTED_PREFIXES.some((p) => matches(pathname, p))) {
    return redirectTo("/login", `?next=${encodeURIComponent(pathname)}`);
  }

  // 2. Signed in, but the route belongs to other roles (or the user has none).
  const required = ROLE_PREFIXES.find(([p]) => matches(pathname, p))?.[1];
  if (user && required) {
    if (!role) return redirectTo(NO_ACCESS);
    if (!required.includes(role)) return redirectTo(ROLE_HOME[role]);
  }

  // 3. Signed-in users don't need the login page.
  if (user && AUTH_ROUTES.includes(pathname)) {
    return redirectTo(role ? ROLE_HOME[role] : NO_ACCESS);
  }

  // Return `response` as-is so the refreshed cookies reach the browser.
  return response;
}