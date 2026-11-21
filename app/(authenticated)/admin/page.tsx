import { Badge, Paper, SimpleGrid, Skeleton, Stack, Table, Text, Title } from "@mantine/core";
import { asc, count, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { db } from "@/db";
import { profiles, sites } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      <Title order={1}>Dashboard</Title>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </Stack>
  );
}

function DashboardSkeleton() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
      </SimpleGrid>
      <Skeleton height={300} />
    </Stack>
  );
}

async function Dashboard() {
  await requireRole("admin"); // check access before any query runs

  const [[{ siteCount }], [{ userCount }], userRows] = await Promise.all([
    db.select({ siteCount: count() }).from(sites),
    db.select({ userCount: count() }).from(profiles),
    db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        siteName: sites.name,
        // Emails live in Supabase's auth.users, so read it with a subquery.
        email: sql<string | null>`(select u.email from auth.users u where u.id = ${profiles.id})`,
      })
      .from(profiles)
      .leftJoin(sites, eq(profiles.siteId, sites.id))
      .orderBy(asc(profiles.fullName)),
  ]);

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Paper withBorder p="lg">
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">
            Sites
          </Text>
          <Text fz={36} fw={700} lh={1.2}>
            {siteCount}
          </Text>
          <AnchorLink href="/admin/sites" size="sm">
            View all sites →
          </AnchorLink>
        </Paper>

        <Paper withBorder p="lg">
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">
            Users
          </Text>
          <Text fz={36} fw={700} lh={1.2}>
            {userCount}
          </Text>
          <AnchorLink href="/admin/users" size="sm">
            Manage users →
          </AnchorLink>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Title order={2} size="h4" mb="md">
          Users in the system
        </Title>

        {userRows.length === 0 ? (
          <Text c="dimmed">No users yet.</Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Site</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userRows.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.fullName ?? "—"}</Table.Td>
                    <Table.Td>{u.email ?? "—"}</Table.Td>
                    <Table.Td>
                      {u.role ? (
                        <Badge variant="light" tt="capitalize">
                          {u.role}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No role
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>{u.siteName ?? "—"}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </>
  );
}