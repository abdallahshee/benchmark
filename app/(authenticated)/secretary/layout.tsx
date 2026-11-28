import type { ReactNode } from "react";
import { Suspense } from "react";


import { requireRole } from "@/lib/auth";

import { signOut } from "@/app/login/actions"; // adjust to wherever your signOut action lives
import { RoleNavItem } from "@/types/roles";
import { getSiteSummary } from "../foreman/actions";
import { RoleLayout } from "../foreman/foreman-layout";

const NAV: RoleNavItem[] = [
  { label: "Dashboard", href: "/secretary", icon: "dashboard" },
  { label: "My Reports", href: "/secretary/reports", icon: "reports" },
  // { label: "My site", href: "/secretary/my-site", icon: "sites" },
  // { label: "Users", href: "/secretary/users", icon: "users" },
  {label: "My Workers",href: "/secretary/workers", icon: "workers"}

];

export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <SecretaryShell>{children}</SecretaryShell>
    </Suspense>
  );
}

async function SecretaryShell({ children }: { children: ReactNode }) {
  const user = await requireRole("secretary");
  const site = user.siteId ? await getSiteSummary(user.siteId) : null;

  return (
    <RoleLayout
      roleBadge="Secretary"
      homeHref="/secretary"
      navItems={NAV}
      user={user}
      // siteName={site?.name ?? null}
      signOutAction={signOut}
    >
      {children}
    </RoleLayout>
  );
}