
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
    <AdminPage
      title="Dashboard"
      description="Monitor today's site activity and what needs your attention."
    >
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
  await requireRole("admin");

  const { siteCount, reportCount, userCount, today, todayReports, setup } =
    await getDashboardData();

  const percent = today.activeSiteCount
    ? Math.round((today.reportedCount / today.activeSiteCount) * 100)
    : 0;

  const allReported =
    today.activeSiteCount > 0 && today.notReported.length === 0;

  const needsSetup =
    setup.sitesMissingStaff.length > 0 ||
    setup.usersWithoutRoleCount > 0;

  const morePeople =
    setup.usersWithoutRoleCount - setup.usersWithoutRole.length;

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
          label="Reports submitted today"
          value={todayReports.length}
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
        <Panel
          title="Today's site activity"
          description="Daily reporting progress across active sites"
        >
          {today.activeSiteCount === 0 ? (
            <Text c="dimmed">There are no active sites.</Text>
          ) : (
            <Stack gap="sm">
              <Group justify="space-between" align="baseline">
                <Text>
                  <Text span fw={700} fz={28}>
                    {today.reportedCount}
                  </Text>{" "}
                  of {today.activeSiteCount} sites reported
                </Text>
                <Text size="sm" c="dimmed">
                  {percent}%
                </Text>
              </Group>

              <Progress
                value={percent}
                size="lg"
                radius="xl"
                color={allReported ? "green" : "yellow"}
              />

              {allReported ? (
                <Text size="sm" c="dimmed" mt="xs">
                  Every active site has submitted a report today.
                </Text>
              ) : (
                <Stack gap="xs" mt="xs">
                  <Text size="sm" fw={600}>
                    Awaiting today's report
                  </Text>

                  {today.notReported.map((s) => (
                    <Group key={s.id} justify="space-between">
                      <AnchorLink
                        href={`/admin/sites/${s.id}`}
                        size="sm"
                        fw={500}
                      >
                        {s.name}
                      </AnchorLink>

                      <Badge variant="light" color="red">
                        Not submitted
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Panel>

        <Panel title="Needs setup" description="Things that need your attention">
          {!needsSetup ? (
            <Text c="dimmed">
              Every active site has a foreman and a secretary, and every user
              has a role.
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
                      <AnchorLink
                        href={`/admin/sites/${s.id}`}
                        size="sm"
                        fw={500}
                      >
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
        title="Reports submitted today"
        description={`${todayReports.length} ${
          todayReports.length === 1 ? "report" : "reports"
        } received across all sites`}
        action={
          <AnchorLink href="/admin/reports" size="sm">
            View all reports →
          </AnchorLink>
        }
        flush
      >
        {todayReports.length === 0 ? (
          <EmptyState
            title="No reports submitted today"
            text="Reports will appear here as site teams submit their daily updates."
          />
        ) : (
          <TableScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>Site</Th>
                  <Th>Submitted by</Th>
                  <Th>Submission time</Th>
                  <Th ta="right">Details</Th>
                </TableTr>
              </TableThead>

              <TableTbody>
                {todayReports.map((r) => (
                  <TableTr key={r.id}>
                    <TableTd>
                      <Text size="sm" fw={600}>
                        {r.siteName}
                      </Text>
                    </TableTd>

                    <TableTd>
                      <Text size="sm">
                        {displayName({
                          firstName: r.creatorFirstName,
                          lastName: r.creatorLastName,
                        })}
                      </Text>
                    </TableTd>

                    <TableTd>
                      <Text size="sm">
                        {formatDateTime(r.createdAt)}
                      </Text>
                    </TableTd>

                    <TableTd ta="right">
                      <AnchorLink
                        href={`/admin/reports/${r.id}`}
                        size="sm"
                        fw={600}
                      >
                        View report →
                      </AnchorLink>
                    </TableTd>
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
