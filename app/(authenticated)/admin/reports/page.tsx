import {
  Badge,
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
import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { ReportsFilter } from "./reports-filter";
import { getReports, parseDay } from "./actions";
import { displayName, formatDateTime } from "@/lib/formats";

export const metadata: Metadata = { title: "Reports" };

const REPORT_STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "green",
  reopened: "yellow",
};

type PageProps = {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
};

export default function AdminReportsPage({ searchParams }: PageProps) {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-5xl flex-1">
      {/* <AnchorLink href="/admin" size="sm">
        ← Dashboard
      </AnchorLink> */}
      <Title order={1}>Reports</Title>
      <Suspense fallback={<Skeleton height={300} />}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </Stack>
  );
}

async function Reports({ searchParams }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const params = await searchParams;
  let from = parseDay(params.from);
  let to = parseDay(params.to);
  if (from && to && from > to) [from, to] = [to, from]; // tolerate a reversed range

  const rows = await getReports({ from, to });
  const filtered = Boolean(from || to);

  return (
    <>
      {/* key remounts the picker when the URL changes, so it always shows the applied range */}
      <ReportsFilter key={`${from ?? ""}_${to ?? ""}`} from={from} to={to} />

      <Paper withBorder p="lg">
        {rows.length === 0 ? (
          <Text c="dimmed">
            {filtered
              ? "No reports were created in this date range."
              : "No reports have been recorded yet."}
          </Text>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="md">
              {rows.length} {rows.length === 1 ? "report" : "reports"}, newest first, then by site
              name.
            </Text>
            <TableScrollContainer minWidth={640}>
              <Table verticalSpacing="sm" highlightOnHover>
                <TableThead>
                  <TableTr>
                    <TableTh>Site</TableTh>
                    <TableTh>Created by</TableTh>
                    <TableTh>Created</TableTh>
                    <TableTh>Status</TableTh>
                    <TableTh />
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {rows.map((r) => (
                    <TableTr key={r.id}>
                      <TableTd>
                        <AnchorLink href={`/admin/reports/${r.id}`} size="sm" fw={500}>
                          {r.siteName}
                        </AnchorLink>
                      </TableTd>
                      <TableTd>
                        {displayName({
                          firstName: r.creatorFirstName,
                          lastName: r.creatorLastName,
                        })}
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
          </>
        )}
      </Paper>
    </>
  );
}