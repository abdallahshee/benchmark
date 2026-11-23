import {
  Anchor,
  Badge,
  Group,
  SimpleGrid,
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

import {
  AdminPage,
  Avatar,
  Field,
  Panel,
  ReportStatusBadge,
  SiteStatusBadge,
  StatCard,
  Th,
  initialsOf,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDate, formatDateTime } from "@/lib/formats";
import { getForemanBySiteId, getReportsBySiteId, getSiteById } from "./action";

export const metadata: Metadata = { title: "Site details" };

type PageProps = { params: Promise<{ id: string }> };

export default function SiteDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Site" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={400} radius="md" />
        </AdminPage>
      }
    >
      <SiteDetails params={params} />
    </Suspense>
  );
}

async function SiteDetails({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const [site, foreman, siteReports] = await Promise.all([
    getSiteById(id),
    getForemanBySiteId(id),
    getReportsBySiteId(id),
  ]);
  if (!site) notFound();

  return (
    <AdminPage
      title={site.name}
      description="Site overview, team and reports"
      back={{ href: "/admin/sites", label: "Sites" }}
      actions={<SiteStatusBadge status={site.status} />}
    >
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard label="Users" value={site.users.length} icon="users" color="teal" />
        <StatCard label="Reports" value={site.reportCount} icon="reports" color="blue" />
        <StatCard
          label="Today's report"
          value={site.hasTodayReport ? "Reported" : "Not yet"}
          icon="check"
          color={site.hasTodayReport ? "green" : "yellow"}
          valueColor={site.hasTodayReport ? "green" : site.status === "active" ? "red" : "dimmed"}
        />
      </SimpleGrid>

      <Panel title="Foreman" description="The person who records this site's daily report">
        {foreman ? (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <Group gap="sm" wrap="nowrap">
              <Avatar color="yellow" radius="xl" size="lg">
                {initialsOf(foreman)}
              </Avatar>
              <div>
                <Text fw={600}>{displayName(foreman)}</Text>
                <Text size="sm" c="dimmed">
                  Site foreman
                </Text>
              </div>
            </Group>
            <Field label="Phone">
              {foreman.phone ? (
                <Anchor href={`tel:${foreman.phone}`} size="sm">
                  {foreman.phone}
                </Anchor>
              ) : (
                <Text size="sm">—</Text>
              )}
            </Field>
            <Field label="Email">
              {foreman.email ? (
                <Anchor href={`mailto:${foreman.email}`} size="sm">
                  {foreman.email}
                </Anchor>
              ) : (
                <Text size="sm">—</Text>
              )}
            </Field>
          </SimpleGrid>
        ) : (
          <Text c="dimmed">No foreman is assigned to this site yet.</Text>
        )}
      </Panel>

      <Panel title="Users on this site" description={`${site.users.length} assigned`} flush>
        {site.users.length === 0 ? (
          <Text c="dimmed" p="lg">
            No users are assigned to this site yet.
          </Text>
        ) : (
          <TableScrollContainer minWidth={480}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>First name</Th>
                  <Th>Last name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                </TableTr>
              </TableThead>
              <TableTbody>
                {site.users.map((u) => (
                  <TableTr key={u.id}>
                    <TableTd>{u.firstName || "—"}</TableTd>
                    <TableTd>{u.lastName || "—"}</TableTd>
                    <TableTd>{u.email ?? "—"}</TableTd>
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

      <Panel title="Reports" description="Latest first" flush>
        {siteReports.length === 0 ? (
          <Text c="dimmed" p="lg">
            No reports have been recorded for this site yet.
          </Text>
        ) : (
          <TableScrollContainer minWidth={520}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>Report date</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th />
                </TableTr>
              </TableThead>
              <TableTbody>
                {siteReports.map((r) => (
                  <TableTr key={r.id}>
                    <TableTd fw={600}>{formatDate(r.createdAt)}</TableTd>
                    <TableTd>
                      <ReportStatusBadge status={r.status} />
                    </TableTd>
                    <TableTd>{formatDateTime(r.createdAt)}</TableTd>
                    <TableTd ta="right">
                      <LinkButton href={`/admin/reports/${r.id}`} size="xs" variant="light">
                        Read
                      </LinkButton>
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