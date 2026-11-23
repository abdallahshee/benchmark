import {
  Badge,
  Skeleton,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
  Group,
} from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, Th } from "@/components/admin-ui";
import { AddUserButton } from "@/components/add-user-button";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/formats";
import { SITE_ROLES } from "@/lib/site-roles";

import { getSiteById } from "../action";
import { getUsersBySiteId } from "../../actions";

export const metadata: Metadata = {
  title: "Site users",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SiteUsersPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Users"
          back={{ href: "/admin/sites", label: "Sites" }}
        >
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <SiteUsers params={params} />
    </Suspense>
  );
}

async function SiteUsers({ params }: PageProps) {
  await requireRole("admin");

  const { id } = await params;

  const [site, users] = await Promise.all([
    getSiteById(id),
    getUsersBySiteId(id),
  ]);

  if (!site) notFound();

  const hasForeman = users.some((user) => user.role === "foreman");
  const hasSecretary = users.some((user) => user.role === "secretary");

  const vacant = SITE_ROLES.filter(
    (role) => !users.some((user) => user.role === role),
  );

  return (
    <AdminPage
      title="Users"
      description={`People assigned to ${site.name}`}
      back={{
        href: `/admin/sites/${site.id}`,
        label: site.name,
      }}
      actions={
        <Group gap="sm">
          <AddUserButton
            label="Add foreman"
            href={`/admin/sites/${site.id}/users/new?role=foreman`}
            color="blue"
            disabledReason={
              hasForeman ? "This site already has a foreman." : undefined
            }
          />

          <AddUserButton
            label="Add secretary"
            href={`/admin/sites/${site.id}/users/new?role=secretary`}
            color="teal"
            disabledReason={
              hasSecretary ? "This site already has a secretary." : undefined
            }
          />
        </Group>
      }
    >
      <Panel
        title="Site users"
        description={
          vacant.length === 0
            ? `${users.length} assigned · fully staffed`
            : `${users.length} assigned · missing ${vacant.join(" and ")}`
        }
        flush
      >
        {users.length === 0 ? (
          <EmptyState
            title="No users on this site yet"
            text="Use Add foreman or Add secretary to invite the site's staff."
          />
        ) : (
          <TableScrollContainer minWidth={560}>
            <Table
              verticalSpacing="sm"
              horizontalSpacing="lg"
              highlightOnHover
            >
              <TableThead>
                <TableTr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Role</Th>
                </TableTr>
              </TableThead>

              <TableTbody>
                {users.map((user) => (
                  <TableTr key={user.id}>
                    <TableTd fw={600}>
                      {displayName(user)}
                    </TableTd>

                    <TableTd>
                      {user.email ?? "—"}
                    </TableTd>

                    <TableTd>
                      {user.phone || "—"}
                    </TableTd>

                    <TableTd>
                      {user.role ? (
                        <Badge variant="light" tt="capitalize">
                          {user.role}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No role
                        </Text>
                      )}
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </TableScrollContainer>
        )}
      </Panel>
    </AdminPage>
  );
}