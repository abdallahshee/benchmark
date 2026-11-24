import {
  Group,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";

import { EmptyState, Panel, ReportStatusBadge, Th } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { displayName, formatDate, formatMoney } from "@/lib/formats";
import { PAGE_SIZE, type ReportFilters, type SiteReportsResult } from "@/lib/queries/site-reports";
import { ReportsPagination, ReportsToolbar } from "./reports-toolbar";

type Props = {
  data: SiteReportsResult;
  filters: ReportFilters;
  basePath: string; // this list's own URL, used by the filters and the pagination
  detailsBasePath: string; // each row's View button goes to `${detailsBasePath}/${id}`
};

export function SiteReportsSection({ data, filters, basePath, detailsBasePath }: Props) {
  const filtered = Boolean(filters.status || filters.from || filters.to);
  const start = data.total === 0 ? 0 : (data.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(data.page * PAGE_SIZE, data.total);

  return (
    <>
      {/* key remounts the toolbar when the URL changes, so it always shows what is applied */}
      <ReportsToolbar
        key={`${filters.status ?? ""}_${filters.from ?? ""}_${filters.to ?? ""}`}
        basePath={basePath}
        options={data.options}
        status={filters.status}
        from={filters.from}
        to={filters.to}
      />

      <Panel
        title="Reports"
        description={`${data.total} ${data.total === 1 ? "report" : "reports"}${filtered ? " match your filters" : ""}`}
        flush
      >
        {data.rows.length === 0 ? (
          <EmptyState
            title={filtered ? "No reports match these filters" : "No reports yet"}
            text={
              filtered
                ? "Try another status or a wider date range."
                : "Reports will appear here as they are created."
            }
          />
        ) : (
          <>
            <TableScrollContainer minWidth={760}>
              <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
                <TableThead>
                  <TableTr>
                    <Th>Report date</Th>
                    <Th>Created by</Th>
                    <Th ta="right">Machines</Th>
                    <Th ta="right">Materials cost</Th>
                    <Th>Status</Th>
                    <Th />
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {data.rows.map((r) => (
                    <TableTr key={r.id}>
                      <TableTd fw={600}>{formatDate(r.createdAt)}</TableTd>
                      <TableTd>
                        {displayName({
                          firstName: r.creatorFirstName,
                          lastName: r.creatorLastName,
                        })}
                      </TableTd>
                      <TableTd ta="right">{r.machineCount}</TableTd>
                      <TableTd ta="right">{formatMoney(r.materialsCost)}</TableTd>
                      <TableTd>
                        <ReportStatusBadge status={r.status} />
                        {/* {r.status === "rejected" && r.rejectionReason && (
                          <Text size="xs" c="red" mt={4} maw={260}>
                            {r.rejectionReason}
                          </Text>
                        )} */}
                      </TableTd>
                      <TableTd ta="right">
                        <LinkButton href={`${detailsBasePath}/${r.id}`} size="xs" variant="light">
                          View
                        </LinkButton>
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
                status={filters.status}
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