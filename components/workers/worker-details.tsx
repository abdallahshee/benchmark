import {
  Badge,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Anchor,
  Text,
} from "@mantine/core";

import { AdminPage, Field, Panel, SiteStatusBadge, StatCard, Th } from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { displayName, formatDay } from "@/lib/formats";
import { WorkerDetails } from "@/lib/workers";
// import type { WorkerDetails } from "@/lib/queries/worker-details";

type Props = {
  worker: WorkerDetails;
  back: { href: string; label: string };
  reportsBasePath: string; // each attendance row links to `${reportsBasePath}/${reportId}`
  sitesBasePath?: string; // only the admin has site pages to link to
};

export function WorkerDetailsView({ worker, back, reportsBasePath, sitesBasePath }: Props) {
  const name = displayName(worker);

  return (
    <AdminPage
      title={name}
      description="Worker profile"
      back={back}
      actions={
        <Group gap="sm">
          <Badge size="lg" variant="light" tt="capitalize">
            {worker.trade}
          </Badge>
          {worker.phone && (
            <Button component="a" href={`tel:${worker.phone}`} size="xs" variant="light">
              Call
            </Button>
          )}
        </Group>
      }
    >
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard
          label="Reports attended"
          value={worker.stats.reportsAttended}
          icon="reports"
          color="blue"
        />
        <StatCard
          label="Total hours"
          value={Number(worker.stats.totalHours).toFixed(1)}
          icon="check"
          color="teal"
        />
        <StatCard
          label="Last on duty"
          value={worker.stats.lastWorked ? formatDay(worker.stats.lastWorked) : "Never"}
          icon="inbox"
          color="yellow"
        />
      </SimpleGrid>

      <Panel title="Contact">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Field label="Phone">
            {worker.phone ? (
              <Anchor href={`tel:${worker.phone}`} size="sm">
                {worker.phone}
              </Anchor>
            ) : (
              <Text size="sm">—</Text>
            )}
          </Field>
          <Field label="Email">
            {worker.email ? (
              <Anchor href={`mailto:${worker.email}`} size="sm">
                {worker.email}
              </Anchor>
            ) : (
              <Text size="sm">—</Text>
            )}
          </Field>
          {/* null for roles that don't keep the registry */}
          {worker.idNumber !== null && (
            <Field label="ID number">
              <Text size="sm">{worker.idNumber}</Text>
            </Field>
          )}
          <Field label="Registered">
            <Text size="sm">{formatDay(worker.createdAt)}</Text>
          </Field>
        </SimpleGrid>
      </Panel>

      <Panel title={worker.sites.length === 1 ? "Site" : "Sites"}>
        {worker.sites.length === 0 ? (
          <Text c="dimmed">This worker isn&apos;t assigned to a site.</Text>
        ) : (
          <Stack gap="xs">
            {worker.sites.map((s) => (
              <Group key={s.id} justify="space-between">
                {sitesBasePath ? (
                  <AnchorLink href={`${sitesBasePath}/${s.id}`} size="sm" fw={600}>
                    {s.name}
                  </AnchorLink>
                ) : (
                  <Text size="sm" fw={600}>
                    {s.name}
                  </Text>
                )}
                <SiteStatusBadge status={s.status} />
              </Group>
            ))}
          </Stack>
        )}
      </Panel>

      <Panel title="Recent attendance" description="The ten latest reports this worker was on duty" flush>
        {worker.recent.length === 0 ? (
          <Text c="dimmed" p="lg">
            This worker hasn&apos;t been recorded on any report yet.
          </Text>
        ) : (
          <TableScrollContainer minWidth={420}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <TableThead>
                <TableTr>
                  <Th>Report date</Th>
                  <Th>Site</Th>
                  <Th ta="right">Hours worked</Th>
                </TableTr>
              </TableThead>
              <TableTbody>
                {worker.recent.map((r) => (
                  <TableTr key={r.reportId}>
                    <TableTd>
                      <AnchorLink href={`${reportsBasePath}/${r.reportId}`} size="sm" fw={600}>
                        {formatDay(r.createdAt)}
                      </AnchorLink>
                    </TableTd>
                    <TableTd>{r.siteName}</TableTd>
                    <TableTd ta="right">{r.hours}</TableTd>
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