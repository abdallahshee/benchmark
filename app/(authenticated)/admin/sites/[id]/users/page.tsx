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
} from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, Th } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/formats";
import { SITE_ROLES } from "@/lib/site-roles";
import { AddUserButton } from "@/components/add-user-button";
import { getSiteById } from "../action";
import { getUsersBySiteId } from "../../actions";

export const metadata: Metadata = { title: "Site users" };

type PageProps = { params: Promise<{ id: string }> };

export default function SiteUsersPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Users" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <SiteUsers params={params} />
    </Suspense>
  );
}

async function SiteUsers({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const [site, users] = await Promise.all([getSiteById(id), getUsersBySiteId(id)]);
  if (!site) notFound();

  // Roles this site doesn't have yet. When none are left, adding is switched off.
  const vacant = SITE_ROLES.filter((r) => !users.some((u) => u.role === r));
  const addHref = `/admin/sites/${site.id}/users/new${vacant.length === 1 ? `?role=${vacant[0]}` : ""}`;

  return (
    <AdminPage
      title="Users"
      description={`People assigned to ${site.name}`}
      back={{ href: `/admin/sites/${site.id}`, label: site.name }}
      actions={
        <AddUserButton
          href={addHref}
          disabledReason={
            vacant.length === 0
              ? "This site already has a foreman and a secretary. A site can have only one of each."
              : undefined
          }
        />
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
            text="Use Add user to invite the site's foreman and secretary."
          />
        ) : (
          <TableScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Role</Th>
                </TableTr>
              </TableThead>
              <TableTbody>
                {users.map((u) => (
                  <TableTr key={u.id}>
                    <TableTd fw={600}>{displayName(u)}</TableTd>
                    <TableTd>{u.email ?? "—"}</TableTd>
                    <TableTd>{u.phone || "—"}</TableTd>
                    <TableTd>
                      {u.role ? (
                        <Badge variant="light" tt="capitalize">
                          {u.role}
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