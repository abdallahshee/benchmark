import {
  Anchor,
  Badge,
  Group,
  Paper,
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
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/formats";
import { getForemanBySiteId, getReportsBySiteId, getSiteById } from "./action";
import { displayName } from "@/lib/formats";

export const metadata: Metadata = { title: "Site details" };

const SITE_STATUS_COLOR: Record<string, string> = {
  active: "green",
  on_hold: "yellow",
  completed: "blue",
  archived: "gray",
};

const REPORT_STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "green",
  reopened: "yellow",
};

type PageProps = { params: Promise<{ id: string }> };

export default function SiteDetailsPage({ params }: PageProps) {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      <AnchorLink href="/admin/sites" size="sm">
        ← Sites
      </AnchorLink>
      <Suspense fallback={<Skeleton height={400} />}>
        <SiteDetails params={params} />
      </Suspense>
    </Stack>
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
    <>
      <Group justify="space-between" align="center">
        <Title order={1}>{site.name}</Title>
        <Badge
          size="lg"
          variant="light"
          color={SITE_STATUS_COLOR[site.status] ?? "gray"}
          tt="capitalize"
        >
          {site.status.replace("_", " ")}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper withBorder p="lg">
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">
            Users
          </Text>
          <Text fz={32} fw={700} lh={1.2}>
            {site.users.length}
          </Text>
        </Paper>

        <Paper withBorder p="lg">
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">
            Reports
          </Text>
          <Text fz={32} fw={700} lh={1.2}>
            {site.reportCount}
          </Text>
        </Paper>

        <Paper withBorder p="lg">
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">
            Today&apos;s report
          </Text>
          <Badge
            mt="xs"
            size="lg"
            variant="light"
            color={site.hasTodayReport ? "green" : site.status === "active" ? "red" : "gray"}
          >
            {site.hasTodayReport ? "Submitted today" : "None yet"}
          </Badge>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Title order={2} size="h4" mb="md">
          Foreman
        </Title>
        {foreman ? (
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Stack gap={2}>
              
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Name
              </Text>
              <Text>{displayName(foreman)}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Phone
              </Text>
              {foreman.phone ? <Anchor href={`tel:${foreman.phone}`}>{foreman.phone}</Anchor> : <Text>—</Text>}
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Email
              </Text>
              {foreman.email ? <Anchor href={`mailto:${foreman.email}`}>{foreman.email}</Anchor> : <Text>—</Text>}
            </Stack>
          </SimpleGrid>
        ) : (
          <Text c="dimmed">No foreman is assigned to this site yet.</Text>
        )}
      </Paper>

      <Paper withBorder p="lg">
        <Title order={2} size="h4" mb="md">
          Users on this site
        </Title>
        {site.users.length === 0 ? (
          <Text c="dimmed">No users are assigned to this site yet.</Text>
        ) : (
          <TableScrollContainer minWidth={480}>
            <Table verticalSpacing="sm" highlightOnHover>
              <TableThead>
                <TableTr>
                  <TableTh>Firstname</TableTh>
                    <TableTh>Lastname</TableTh>
                  <TableTh>Email</TableTh>
                  <TableTh>Role</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {site.users.map((u) => (
                  <TableTr key={u.id}>
                    <TableTd>{u.firstName ?? "—"}</TableTd>
                    <TableTd>{u.lastName ?? "—"}</TableTd>
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
      </Paper>

      <Paper withBorder p="lg">
        <Title order={2} size="h4" mb="xs">
          Reports
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Latest first.
        </Text>
        {siteReports.length === 0 ? (
          <Text c="dimmed">No reports have been recorded for this site yet.</Text>
        ) : (
          <TableScrollContainer minWidth={480}>
            <Table verticalSpacing="sm" highlightOnHover>
              <TableThead>
                <TableTr>
                  <TableTh>Report date</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Created</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {siteReports.map((r) => (
                  <TableTr key={r.id}>
                    <TableTd>{formatDate(r.createdAt)}</TableTd>
                    <TableTd>
                      <Badge
                        variant="light"
                        color={REPORT_STATUS_COLOR[r.status] ?? "gray"}
                        tt="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </TableTd>
                    <TableTd>{formatDateTime(r.createdAt)}</TableTd>
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