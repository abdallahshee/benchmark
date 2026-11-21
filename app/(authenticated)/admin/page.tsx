import { Paper, Skeleton, Stack, Title } from "@mantine/core";
import { asc, eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";


export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      <AnchorLink href="/account" size="sm">
        ← Account
      </AnchorLink>
      <Title order={1}>Users</Title>
      <Suspense fallback={<Skeleton height={300} />}>
        <Users />
      </Suspense>
    </Stack>
  );
}

async function Users() {
  const admin = await requireRole("admin");

  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      email: authUsers.email,
      lastSignInAt: authUsers.lastSignInAt,
    })
    .from(profiles)
    .innerJoin(authUsers, eq(authUsers.id, profiles.id))
    .orderBy(asc(profiles.createdAt));

  const users = rows.map((r) => ({ ...r, lastSignInAt: r.lastSignInAt?.toISOString() ?? null }));

  return (
    <>
      <Paper withBorder p="lg">
        <Title order={2} size="h4" mb="md">
          Invite a user
        </Title>
     
      </Paper>
   
    </>
  );
}
