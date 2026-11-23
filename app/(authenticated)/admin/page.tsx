import {
  Badge,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime } from "@/lib/formats";
import { getDashboardData } from "./dashboard.query";
import { DefinedStatCard } from "@/components/stat-card";


export const metadata: Metadata = { title: "Dashboard" };

const REPORT_STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "green",
  reopened: "yellow",
};

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
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Skeleton height={240} />
        <Skeleton height={240} />
      </SimpleGrid>
      <Skeleton height={300} />
    </Stack>
  );
}

function StatCard({
  label,
  value,
  href,
  linkText,
}: {
  label: string;
  value: number;
  href: string;
  linkText: string;
}) {
  return (
    <Paper withBorder p="lg">
      <Text size="sm" c="dimmed" fw={600} tt="uppercase">
        {label}
      </Text>
      <Text fz={36} fw={700} lh={1.2}>
        {value}
      </Text>
      <AnchorLink href={href} size="sm">
        {linkText}
      </AnchorLink>
    </Paper>
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
  <DefinedStatCard
    label="Sites"
    value={siteCount}
    icon="sites"
    color="blue"
    href="/admin/sites"
    linkText="View all sites →"
  />

 <DefinedStatCard
    label="Reports"
    value={reportCount}
    icon="reports"
    color="yellow"
    href="/admin/reports"
    linkText="View all reports →"
  />

<DefinedStatCard
    label="Users"
    value={userCount}
    icon="users"
    color="teal"
    href="/admin/users"
    linkText="Manage users →"
  />
</SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder p="lg">
          <Title order={2} size="h4" mb="md">
            Today&apos;s reports
          </Title>

          {today.activeSiteCount === 0 ? (
            <Text c="dimmed">There are no active sites.</Text>
          ) : (
            <Stack gap="sm">
              <Text>
                <Text span fw={700} fz={24}>
                  {today.reportedCount}
                </Text>{" "}
                of {today.activeSiteCount} active {today.activeSiteCount === 1 ? "site has" : "sites have"}{" "}
                reported
              </Text>
              <Progress value={percent} color={allReported ? "green" : undefined} />

              {allReported ? (
                <Text size="sm" c="dimmed">
                  Every active site has reported today.
                </Text>
              ) : (
                <>
                  <Text size="sm" c="dimmed" mt="xs">
                    Still waiting for:
                  </Text>
                  {today.notReported.map((s) => (
                    <Group key={s.id} justify="space-between">
                      <AnchorLink href={`/admin/sites/${s.id}`} size="sm">
                        {s.name}
                      </AnchorLink>
                      <Badge variant="light" color="red">
                        No report yet
                      </Badge>
                    </Group>
                  ))}
                </>
              )}
            </Stack>
          )}
        </Paper>

        <Paper withBorder p="lg">
          <Title order={2} size="h4" mb="md">
            Needs setup
          </Title>

          {!needsSetup ? (
            <Text c="dimmed">
              Every active site has a foreman and a secretary, and every user has a role.
            </Text>
          ) : (
            <Stack gap="md">
              {setup.sitesMissingStaff.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Sites missing staff
                  </Text>
                  {setup.sitesMissingStaff.map((s) => (
                    <Group key={s.id} justify="space-between">
                      <AnchorLink href={`/admin/sites/${s.id}`} size="sm">
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
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} size="h4">
            Latest reports
          </Title>
          <AnchorLink href="/admin/reports" size="sm">
            View all →
          </AnchorLink>
        </Group>

        {latestReports.length === 0 ? (
          <Text c="dimmed">No reports have been recorded yet.</Text>
        ) : (
          <TableScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" highlightOnHover>
              <TableThead>
                <TableTr>
                  <TableTh>Site</TableTh>
                  <TableTh>Created by</TableTh>
                  <TableTh>Created</TableTh>
                  <TableTh>Status</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {latestReports.map((r) => (
                  <TableTr key={r.id}>
                    <TableTd>
                      <AnchorLink href={`/admin/reports/${r.id}`} size="sm" fw={500}>
                        {r.siteName}
                      </AnchorLink>
                    </TableTd>
                    <TableTd>
                      {displayName({ firstName: r.creatorFirstName, lastName: r.creatorLastName })}
                    </TableTd>
                    <TableTd>{formatDateTime(r.createdAt)}</TableTd>
                    <TableTd>
                      <Badge
                        variant="light"
                        color={REPORT_STATUS_COLOR[r.status] ?? "gray"}
                        tt="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </TableScrollContainer>
        )}
      </Paper>
    </>
  );
}