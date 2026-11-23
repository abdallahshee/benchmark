import {
  Badge,
  Group,
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
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, SiteStatusBadge, Th } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { formatTime } from "@/lib/formats";
import { getSites } from "./actions";
import { NewSiteModal } from "./new-site-modal";

export const metadata: Metadata = { title: "Sites" };

export default function AdminSitesPage() {
  return (
    <AdminPage
      title="Sites"
      description="Every construction site and whether it has reported today."
      back={{ href: "/admin", label: "Dashboard" }}
      actions={<NewSiteModal />}
    >
      <Suspense fallback={<Skeleton height={320} radius="md" />}>
        <Sites />
      </Suspense>
    </AdminPage>
  );
}

async function Sites() {
  await requireRole("admin"); // check access before any query runs

  const rows = await getSites();
  const reportedCount = rows.filter((s) => s.todayReportAt != null).length;

  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="No sites yet"
          text="Use the New site button to create your first site."
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="All sites"
      description={`${rows.length} ${rows.length === 1 ? "site" : "sites"} · ${reportedCount} reported today`}
      flush
    >
      <TableScrollContainer minWidth={640}>
        <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
          <TableThead>
            <TableTr>
              <Th>Site</Th>
              <Th>Status</Th>
              <Th>Users</Th>
              <Th>Today&apos;s report</Th>
              <Th />
            </TableTr>
          </TableThead>
          <TableTbody>
            {rows.map((s) => (
              <TableTr key={s.id}>
                <TableTd>
                  <Text size="sm" fw={600}>
                    {s.name}
                  </Text>
                </TableTd>
                <TableTd>
                  <SiteStatusBadge status={s.status} />
                </TableTd>
                <TableTd>{s.userCount}</TableTd>
                <TableTd>
                  {s.todayReportAt != null ? (
                    <Group gap="xs">
                      <Badge variant="light" color="green">
                        Reported
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {formatTime(s.todayReportAt)}
                      </Text>
                    </Group>
                  ) : s.status === "active" ? (
                    <Badge variant="light" color="red">
                      Not yet
                    </Badge>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </TableTd>
                <TableTd ta="right">
                  <LinkButton href={`/admin/sites/${s.id}`} size="xs" variant="light">
                    View
                  </LinkButton>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableScrollContainer>
    </Panel>
  );
}