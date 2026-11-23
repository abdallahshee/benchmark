import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, Panel } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { getUsers } from "./actions";
import { InviteForm } from "./invite-user-form";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <AdminPage
      title="Users"
      description="Invite people to the system and manage their roles."
      back={{ href: "/admin", label: "Dashboard" }}
    >
      <Suspense fallback={<Skeleton height={400} radius="md" />}>
        <Users />
      </Suspense>
    </AdminPage>
  );
}

async function Users() {
  const admin = await requireRole("admin");
  const users = await getUsers();

  return (
    <>
      <Panel title="Invite a user" description="They get an email to set up their account.">
        <InviteForm />
      </Panel>

      <Panel title="Team members" description="Admins and your own account are not listed." flush>
        <UsersTable users={users} currentUserId={admin.id} />
      </Panel>
    </>
  );
}