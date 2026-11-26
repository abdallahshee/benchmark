import {
  Badge,
  Group,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminPage,
  EmptyState,
  Panel,
  // ReportStatusBadge,
  StatCard,
  Th,
} from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime } from "@/lib/formats";
import { getDashboardData } from "./actions";



export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <AdminPage title="Dashboard" description="What needs your attention across all sites.">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </AdminPage>
  );
}

function DashboardSkeleton() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Skeleton height={130} radius="md" />
        <Skeleton height={130} radius="md" />
        <Skeleton height={130} radius="md" />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Skeleton height={260} radius="md" />
        <Skeleton height={260} radius="md" />
      </SimpleGrid>
      <Skeleton height={320} radius="md" />
    </Stack>
  );
}

async function Dashboard() {
  await requireRole("admin"); // check access before any query runs

  const { siteCount, reportCount, userCount, today, latestReports, setup } =
    await getDashboardData();

  const percent = today.activeSiteCount
    ? Math.round((today.reportedCount / today.activeSiteCount) * 100)
    : 0;
  const allReported = today.activeSiteCount > 0 && today.notReported.length === 0;
  const needsSetup = setup.sitesMissingStaff.length > 0 || setup.usersWithoutRoleCount > 0;
  const morePeople = setup.usersWithoutRoleCount - setup.usersWithoutRole.length;

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard
          label="Sites"
          value={siteCount}
          icon="sites"
          color="blue"
          href="/admin/sites"
          linkText="View all sites →"
        />
        <StatCard
          label="Reports"
          value={reportCount}
          icon="reports"
          color="yellow"
          href="/admin/reports"
          linkText="View all reports →"
        />
        <StatCard
          label="Users"
          value={userCount}
          icon="users"
          color="teal"
          href="/admin/users"
          linkText="Manage users →"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Panel title="Today's reports" description="Active sites only">
          {today.activeSiteCount === 0 ? (
            <Text c="dimmed">There are no active sites.</Text>
          ) : (
            <Stack gap="sm">
              <Group justify="space-between" align="baseline">
                <Text>
                  <Text span fw={700} fz={28}>
                    {today.reportedCount}
                  </Text>{" "}
                  of {today.activeSiteCount} reported
                </Text>
                <Text size="sm" c="dimmed">
                  {percent}%
                </Text>
              </Group>
              <Progress value={percent} size="lg" radius="xl" color={allReported ? "green" : "yellow"} />

              {allReported ? (
                <Text size="sm" c="dimmed" mt="xs">
                  Every active site has reported today.
                </Text>
              ) : (
                <Stack gap="xs" mt="xs">
                  <Text size="sm" c="dimmed">
                    Still waiting for:
                  </Text>
                  {today.notReported.map((s) => (
                    <Group key={s.id} justify="space-between">
                      <AnchorLink href={`/admin/sites/${s.id}`} size="sm" fw={500}>
                        {s.name}
                      </AnchorLink>
                      <Badge variant="light" color="red">
                        No report yet
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Panel>

        <Panel title="Needs setup" description="Things only you can fix">
          {!needsSetup ? (
            <Text c="dimmed">
              Every active site has a foreman and a secretary, and every user has a role.
            </Text>
          ) : (
            <Stack gap="lg">
              {setup.sitesMissingStaff.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Sites missing staff
                  </Text>
                  {setup.sitesMissingStaff.map((s) => (
                    <Group key={s.id} justify="space-between">
                      <AnchorLink href={`/admin/sites/${s.id}`} size="sm" fw={500}>
                        {s.name}
                      </AnchorLink>
                      <Group gap="xs">
                        {s.missingForeman && (
                          <Badge variant="light" color="red">
                            No foreman
                          </Badge>
                        )}
                        {s.missingSecretary && (
                          <Badge variant="light" color="orange">
                            No secretary
                          </Badge>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              )}

              {setup.usersWithoutRoleCount > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Users without a role ({setup.usersWithoutRoleCount})
                  </Text>
                  {setup.usersWithoutRole.map((u) => (
                    <Group key={u.id} justify="space-between">
                      <Text size="sm">{displayName(u)}</Text>
                      <Text size="sm" c="dimmed">
                        {u.email ?? "—"}
                      </Text>
                    </Group>
                  ))}
                  {morePeople > 0 && (
                    <Text size="sm" c="dimmed">
                      and {morePeople} more
                    </Text>
                  )}
                  <AnchorLink href="/admin/users" size="sm">
                    Assign roles →
                  </AnchorLink>
                </Stack>
              )}
            </Stack>
          )}
        </Panel>
      </SimpleGrid>

      <Panel
        title="Latest reports"
        action={
          <AnchorLink href="/admin/reports" size="sm">
            View all →
          </AnchorLink>
        }
        flush
      >
        {latestReports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            text="Reports will appear here as foremen submit them."
          />
        ) : (
          <TableScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>Site</Th>
                  <Th>Created by</Th>
                  <Th>Created</Th>
                  {/* <Th>Status</Th> */}
                </TableTr>
              </TableThead>
              <TableTbody>
                {latestReports.map((r) => (
                  <TableTr key={r.id}>
                    <TableTd>
                      <AnchorLink href={`/admin/reports/${r.id}`} size="sm" fw={600}>
                        {r.siteName}
                      </AnchorLink>
                    </TableTd>
                    <TableTd>
                      {displayName({ firstName: r.creatorFirstName, lastName: r.creatorLastName })}
                    </TableTd>
                    <TableTd>{formatDateTime(r.createdAt)}</TableTd>
                    {/* <TableTd>
                      <ReportStatusBadge status={r.status} />
                    </TableTd> */}
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </TableScrollContainer>
        )}
      </Panel>
    </>
  );
}