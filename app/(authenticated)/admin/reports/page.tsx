import {
  Skeleton,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, ReportStatusBadge, Th } from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime } from "@/lib/formats";
import { getReports, parseDay } from "./actions";
import { ReportsFilter } from "./reports-filter";

export const metadata: Metadata = { title: "Reports" };

type PageProps = {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
};

export default function AdminReportsPage({ searchParams }: PageProps) {
  return (
    <AdminPage
      title="Reports"
      description="Daily reports from every site, newest first."
      back={{ href: "/admin", label: "Dashboard" }}
    >
      <Suspense fallback={<Skeleton height={320} radius="md" />}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </AdminPage>
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
    <Panel
      title="All reports"
      description={`${rows.length} ${rows.length === 1 ? "report" : "reports"}${filtered ? " in this range" : ""}`}
      // key remounts the picker when the URL changes, so it always shows the applied range
      action={<ReportsFilter key={`${from ?? ""}_${to ?? ""}`} from={from} to={to} />}
      flush
    >
      {rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No reports in this range" : "No reports yet"}
          text={
            filtered
              ? "Try a wider date range, or clear the filter."
              : "Reports will appear here as foremen submit them."
          }
        />
      ) : (
        <TableScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
            <TableThead>
              <TableTr>
                <Th>Site</Th>
                <Th>Created by</Th>
                <Th>Created</Th>
                <Th>Status</Th>
                <Th />
              </TableTr>
            </TableThead>
            <TableTbody>
              {rows.map((r) => (
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
                  <TableTd>
                    <ReportStatusBadge status={r.status} />
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
      )}
    </Panel>
  );
}