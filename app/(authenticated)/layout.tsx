import { AppLayout, NavItem } from "@/components/app-layout";
import { requireRole } from "@/lib/auth";
import { signOut } from "../login/actions";
import { ReactNode, Suspense } from "react";


const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
];



export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

async function AuthGate({ children }: { children: ReactNode }) {
  const user = await requireRole("admin"); // keep whatever you pass today
  return (
    <AppLayout title="Admin" navItems={NAV} user={user} signOutAction={signOut}>
      {children}
    </AppLayout>
  );
}