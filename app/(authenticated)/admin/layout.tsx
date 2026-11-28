import { signOut } from "@/app/login/actions";
import { requireRole } from "@/lib/auth";
import { ReactNode, Suspense } from "react";
import { AdminLayout, NavItem } from "./admin-layout";


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
    <AdminLayout   user={user} signOutAction={signOut} roleBadge="Admin">
      {children}
    </AdminLayout>
  );
}