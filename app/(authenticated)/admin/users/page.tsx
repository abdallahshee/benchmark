import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, Panel } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { UsersTable } from "./users-table";
import { getUsers } from "./actions";
import { UsersSearch } from "./users-search";

export const metadata: Metadata = { title: "Users" };

type PageProps = { searchParams: Promise<{ q?: string | string[] }> };

// The search text comes from the URL, which anyone can edit, so keep it to one short
// string.
function parseSearch(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim().slice(0, 100);
}

export default function AdminUsersPage({ searchParams }: PageProps) {
  return (
    <AdminPage
      title="Users"
      description="Manage roles and remove accounts. To add someone, open a site and use Add user."
      back={{ href: "/admin", label: "Dashboard" }}
    >
      <Suspense fallback={<Skeleton height={400} radius="md" />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function Users({ searchParams }: PageProps) {
  const admin = await requireRole("admin");

  const { q } = await searchParams;
  const search = parseSearch(q);
  const users = await getUsers({ search });

  return (
    <Panel
      title="Team members"
      description={
        search
          ? `${users.length} ${users.length === 1 ? "match" : "matches"} for "${search}"`
          : "Admins and your own account are not listed."
      }
      action={<UsersSearch q={search} />}
      flush
    >
      <UsersTable users={users} currentUserId={admin.id} searching={Boolean(search)} />
    </Panel>
  );
}