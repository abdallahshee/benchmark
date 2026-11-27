import type { ReactNode } from "react";
import { Suspense } from "react";


import { requireRole } from "@/lib/auth";

import { signOut } from "@/app/login/actions"; // adjust to wherever your signOut action lives
import { getSiteSummary } from "./actions";
import { RoleLayout, RoleNavItem } from "./foreman-layout";

const NAV: RoleNavItem[] = [
  { label: "Dashboard", href: "/foreman", icon: "dashboard" },
  { label: "Reports", href: "/foreman/reports", icon: "reports" },
  {label: "Workers", href: "/foreman/workers", icon: "users"}
];

export default function ForemanLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <ForemanShell>{children}</ForemanShell>
    </Suspense>
  );
}

async function ForemanShell({ children }: { children: ReactNode }) {
  const user = await requireRole("foreman");
  const site = user.siteId ? await getSiteSummary(user.siteId) : null;

  return (
    <RoleLayout
      roleBadge="Foreman"
      homeHref="/foreman"
      navItems={NAV}
      user={user}
      siteName={site?.name ?? null}
      signOutAction={signOut}
    >
      {children}
    </RoleLayout>
  );
}