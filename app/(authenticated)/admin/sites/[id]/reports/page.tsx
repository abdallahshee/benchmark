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
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, ReportStatusBadge, Th } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/formats";
import { getReportsBySiteId, getSiteById } from "../action";

export const metadata: Metadata = { title: "Site reports" };

type PageProps = { params: Promise<{ id: string }> };

export default function SiteReportsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Reports" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <SiteReports params={params} />
    </Suspense>
  );
}

async function SiteReports({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const [site, rows] = await Promise.all([getSiteById(id), getReportsBySiteId(id, 200)]);
  if (!site) notFound();

  return (
    <AdminPage
      title="Reports"
      description={`Every report for ${site.name}, newest first.`}
      back={{ href: `/admin/sites/${site.id}`, label: site.name }}
    >
      <Panel
        title="All reports"
        description={`${rows.length} ${rows.length === 1 ? "report" : "reports"}`}
        flush
      >
        {rows.length === 0 ? (
          <EmptyState
            title="No reports yet"
            text="Reports will appear here as the foreman submits them."
          />
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
                {rows.map((r) => (
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