import {
  Button,
  Group,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";

import { EmptyState, Panel, Th } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { displayName, formatDay, formatMoney } from "@/lib/formats";
import { PAGE_SIZE, type ReportFilters, type SiteReportsResult } from "@/lib/queries/site-reports";
import { ReportsPagination, ReportsToolbar } from "./reports-toolbar";


type Props = {
  data: SiteReportsResult;
  filters: ReportFilters;
  basePath: string; // this list's own URL, used by the filter and the pagination
  detailsBasePath: string; // each row's View button goes to `${detailsBasePath}/${id}`
};

export function SiteReportsSection({ data, filters, basePath, detailsBasePath }: Props) {
  const filtered = Boolean(filters.from || filters.to);
  const start = data.total === 0 ? 0 : (data.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(data.page * PAGE_SIZE, data.total);

  return (
    <>
      {/* key remounts the toolbar when the URL changes, so it always shows what is applied */}
      <ReportsToolbar
        key={`${filters.from ?? ""}_${filters.to ?? ""}`}
        basePath={basePath}
        from={filters.from}
        to={filters.to}
      />

      <Panel
        title="Reports"
        description={`${data.total} ${data.total === 1 ? "report" : "reports"}${filtered ? " in this range" : ""}`}
        flush
      >
        {data.rows.length === 0 ? (
          <EmptyState
            title={filtered ? "No reports in this range" : "No reports yet"}
            text={
              filtered
                ? "Try a wider date range, or clear the filter."
                : "Reports will appear here as they are submitted."
            }
          />
        ) : (
          <>
            <TableScrollContainer minWidth={680}>
              <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
                <TableThead>
                  <TableTr>
                    <Th>Report date</Th>
                    <Th>Created by</Th>
                    <Th ta="right">Machines</Th>
                    <Th ta="right">Materials cost</Th>
                    <Th />
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {data.rows.map((r) => (
                    <TableTr key={r.id}>
                      {/* formatDay shows the day in the site's time zone, which is the
                          day the report belongs to */}
                      <TableTd fw={600}>{formatDay(r.createdAt)}</TableTd>
                      <TableTd>
                        {displayName({
                          firstName: r.creatorFirstName,
                          lastName: r.creatorLastName,
                        })}
                      </TableTd>
                      <TableTd ta="right">{r.machineCount}</TableTd>
                      <TableTd ta="right">{formatMoney(r.materialsCost)}</TableTd>
                      <TableTd ta="right">
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <Button
                            component="a"
                            href={`/api/reports/${r.id}/pdf`}
                            size="xs"
                            variant="default"
                          >
                            PDF
                          </Button>
                          <LinkButton href={`${detailsBasePath}/${r.id}`} size="xs" variant="light">
                            View
                          </LinkButton>
                        </Group>
                      </TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            </TableScrollContainer>

            <Group justify="space-between" align="center" p="md">
              <Text size="sm" c="dimmed">
                Showing {start}-{end} of {data.total}
              </Text>
              <ReportsPagination
                basePath={basePath}
                from={filters.from}
                to={filters.to}
                page={data.page}
                pageCount={data.pageCount}
              />
            </Group>
          </>
        )}
      </Panel>
    </>
  );
}