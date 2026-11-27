import { Anchor, Badge, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AdminPage,
  Avatar,
  Field,
  Panel,
  StatCard,
  initialsOf,
} from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime } from "@/lib/formats";
import { ROLE_LABELS } from "@/types/user";
import { getUserById } from "../actions";

export const metadata: Metadata = { title: "User details" };

type PageProps = { params: Promise<{ userId: string }> };

export default function UserDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="User" back={{ href: "/admin/users", label: "Users" }}>
          <Skeleton height={400} radius="md" />
        </AdminPage>
      }
    >
      <UserDetails params={params} />
    </Suspense>
  );
}

async function UserDetails({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) notFound();

  const name = displayName(user);
  const active = user.lastSignInAt != null;

  return (
    <AdminPage
      title={name}
      description="User profile"
      back={{ href: "/admin/users", label: "Users" }}
      actions={
        user.role ? (
          <Badge size="lg" variant="light" color="yellow">
            {ROLE_LABELS[user.role]}
          </Badge>
        ) : (
          <Badge size="lg" variant="light" color="gray">
            No role
          </Badge>
        )
      }
    >
      <Panel>
        <Group gap="md" wrap="nowrap">
          <Avatar color="yellow" radius="xl" size={64}>
            {initialsOf(user)}
          </Avatar>
          <Stack gap={2}>
            <Text fw={700} fz="xl">
              {name}
            </Text>
            <Text c="dimmed" size="sm">
              {user.email ?? "No email"}
            </Text>
            <Group gap="xs" mt={4}>
              <Badge variant="dot" color={active ? "green" : "yellow"}>
                {active ? "Active" : "Invited"}
              </Badge>
            </Group>
          </Stack>
        </Group>
      </Panel>

      <Panel title="Details">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Field label="Email">
            {user.email ? (
              <Anchor href={`mailto:${user.email}`} size="sm">
                {user.email}
              </Anchor>
            ) : (
              <Text size="sm">—</Text>
            )}
          </Field>
          <Field label="Phone">
            {user.phone ? (
              <Anchor href={`tel:${user.phone}`} size="sm">
                {user.phone}
              </Anchor>
            ) : (
              <Text size="sm">—</Text>
            )}
          </Field>
          <Field label="Role">
            <Text size="sm">{user.role ? ROLE_LABELS[user.role] : "No role assigned"}</Text>
          </Field>
          <Field label="Site">
            {user.siteId ? (
              <AnchorLink href={`/admin/sites/${user.siteId}`} size="sm">
                {user.siteName}
              </AnchorLink>
            ) : (
              <Text size="sm" c="dimmed">
                {user.role === "admin" ? "Not applicable" : "Not assigned to a site"}
              </Text>
            )}
          </Field>
          <Field label="Last sign-in">
            <Text size="sm">{user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "Never"}</Text>
          </Field>
          <Field label="Created">
            <Text size="sm">{formatDateTime(user.createdAt)}</Text>
          </Field>
          <Field label="Last updated">
            <Text size="sm">{formatDateTime(user.updatedAt)}</Text>
          </Field>
        </SimpleGrid>
      </Panel>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <StatCard label="Reports created" value={user.reportCount} icon="reports" color="blue" />
        <StatCard
          label="Last report"
          value={user.lastReportAt != null ? formatDateTime(new Date(user.lastReportAt)) : "—"}
          icon="check"
          color="green"
        />
      </SimpleGrid>
    </AdminPage>
  );
}