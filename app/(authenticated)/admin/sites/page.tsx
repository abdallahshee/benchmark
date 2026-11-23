import {
  Badge,
  Group,
  Paper,
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
import { asc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { LinkButton } from "@/components/link-button";
import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";
import { formatTime } from "@/lib/formats";
import { requireRole } from "@/lib/auth";
import { NewSiteModal } from "./new-site-modal";
import { getSites } from "./actions";

export const metadata: Metadata = { title: "Sites" };

// "Today" depends on the time zone. Change this if your sites are elsewhere.


const STATUS_COLOR: Record<string, string> = {
  active: "green",
  on_hold: "yellow",
  completed: "blue",
  archived: "gray",
};

// When the site's first report of today was created, as epoch milliseconds, or null.
// Columns are written as plain SQL (r.site_id, "sites".id) on purpose: Drizzle can drop
// the table prefix from column references in a single-table select, which would make
// the subquery compare against its own id.


export default function AdminSitesPage() {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      {/* <AnchorLink href="/admin" size="sm">
        ← Dashboard
      </AnchorLink> */}

      <Group justify="space-between" align="center">
        <Title order={1}>Sites</Title>
        <NewSiteModal />
      </Group>

      <Suspense fallback={<Skeleton height={300} />}>
        <Sites />
      </Suspense>
    </Stack>
  );
}

async function Sites() {
  await requireRole("admin"); // check access before any query runs

const rows=await getSites()

  return (
    <Paper withBorder p="lg">
      {rows.length === 0 ? (
        <Text c="dimmed">No sites yet. Create the first one with the New site button.</Text>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="md">
            Sites that reported today are listed first, in the order they reported.
          </Text>
          <TableScrollContainer minWidth={640}>
            <Table verticalSpacing="sm" highlightOnHover>
              <TableThead>
                <TableTr>
                  <TableTh>Site</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Users</TableTh>
                  <TableTh>Today&apos;s report</TableTh>
                  <TableTh />
                </TableTr>
              </TableThead>
              <TableTbody>
                {rows.map((s) => (
                  <TableTr key={s.id}>
                    <TableTd>
                      <Text size="sm" fw={500}>
                        {s.name}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <Badge
                        variant="light"
                        color={STATUS_COLOR[s.status] ?? "gray"}
                        tt="capitalize"
                      >
                        {s.status.replace("_", " ")}
                      </Badge>
                    </TableTd>
                    <TableTd>{s.userCount}</TableTd>
                    <TableTd>
                      {s.todayReportAt != null ? (
                        <Group gap="xs">
                          <Badge variant="light" color="green">
                            Yes
                          </Badge>
                          <Text size="sm" c="dimmed">
                            {formatTime(s.todayReportAt)}
                          </Text>
                        </Group>
                      ) : (
                        // Only an active site is expected to report, so only it is flagged.
                        <Badge variant="light" color={s.status === "active" ? "red" : "gray"}>
                          No
                        </Badge>
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
        </>
      )}
    </Paper>
  );
}