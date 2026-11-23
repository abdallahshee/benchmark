import { Paper, Skeleton, Stack, Title } from "@mantine/core";
import { asc, eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";


import { UsersTable } from "./users-table";
import { InviteForm } from "./invite-user-form";
import { getUsers } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      {/* <AnchorLink href="/account" size="sm">
        ← Account
      </AnchorLink> */}
      <Title order={1}>Users</Title>
      <Suspense fallback={<Skeleton height={300} />}>
        <Users />
      </Suspense>
    </Stack>
  );
}

async function Users() {
  const admin = await requireRole("admin");
  const users=await getUsers()
  return (
    <>
      <UsersTable users={users} currentUserId={admin.id} />
    </>
  );
}
