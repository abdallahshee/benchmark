import {
  Anchor,
  Button,
  Divider,
  Group,
  SimpleGrid,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import type { ReactNode } from "react";

import { AdminPage, Field, Panel, StatCard, Th } from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { displayName, formatDateTime, formatDay, formatMoney } from "@/lib/formats";
import type { ReportDetails } from "@/lib/queries/report-details";

type Props = {
  report: ReportDetails;
  back: { href: string; label: string };
  // Only the admin has a site page to link to.
  siteHref?: string;
  // Extra buttons next to Download PDF, for example the secretary's correction button.
  actions?: ReactNode;
};

export function ReportDetailsView({ report, back, siteHref, actions }: Props) {
  const machineCount = report.machineries.reduce((n, m) => n + m.number, 0);
  const workerHours = report.workers.reduce((n, w) => n + Number(w.hours), 0);

  return (
<AdminPage
  title={report.siteName}
  description={`Report for ${formatDay(report.createdAt)}`}
  back={back}
>
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <StatCard label="Workers on duty" value={report.workers.length} icon="users" color="teal" />
        <StatCard label="Worker hours" value={workerHours.toFixed(1)} icon="check" color="blue" />
        <StatCard label="Machines in operation" value={machineCount} icon="gear" color="orange" />
        <StatCard
          label="Materials cost"
          value={formatMoney(report.materialsTotal)}
          icon="money"
          color="green"
        />
      </SimpleGrid>

      <Panel title="Summary">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Field label="Site">
            {siteHref ? (
              <AnchorLink href={siteHref} size="sm">
                {report.siteName}
              </AnchorLink>
            ) : (
              <Text size="sm">{report.siteName}</Text>
            )}
          </Field>
          <Field label="Created by">
            <Text size="sm">
              {displayName({
                firstName: report.creatorFirstName,
                lastName: report.creatorLastName,
              })}
            </Text>
          </Field>
          <Field label="Report date">
            <Text size="sm">{formatDay(report.createdAt)}</Text>
          </Field>
          <Field label="Submitted">
            <Text size="sm">{formatDateTime(report.createdAt)}</Text>
          </Field>
        </SimpleGrid>
        <Divider my="md" />
        <Field label="Notes">
          <Text size="sm" c={report.notes ? undefined : "dimmed"} style={{ whiteSpace: "pre-wrap" }}>
            {report.notes || "No notes."}
          </Text>
        </Field>
      </Panel>

      <Panel
        title="Workers on duty"
        description={`${report.workers.length} ${report.workers.length === 1 ? "worker" : "workers"}`}
        flush
      >
        {report.workers.length === 0 ? (
          <Text c="dimmed" p="lg">
            No workers were recorded in this report.
          </Text>
        ) : (
          <>
            <TableScrollContainer minWidth={520}>
              <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
                <TableThead>
                  <TableTr>
                    <Th>Name</Th>
                    <Th>Trade</Th>
                    <Th>Phone</Th>
                    <Th ta="right">Hours worked</Th>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {report.workers.map((w) => (
                    <TableTr key={w.id}>
                      <TableTd fw={600}>{displayName(w)}</TableTd>
                      <TableTd tt="capitalize">{w.trade}</TableTd>
                      <TableTd>
                        {w.phone ? (
                          <Anchor href={`tel:${w.phone}`} size="sm">
                            {w.phone}
                          </Anchor>
                        ) : (
                          "—"
                        )}
                      </TableTd>
                      <TableTd ta="right">{w.hours}</TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            </TableScrollContainer>
            <Divider />
            <Group justify="space-between" px="lg" py="md">
              <Text fw={600}>Total worker hours</Text>
              <Text fw={700}>{workerHours.toFixed(2)}</Text>
            </Group>
          </>
        )}
      </Panel>

      <Panel title="Machineries" description={`${report.machineries.length} categories`} flush>
        {report.machineries.length === 0 ? (
          <Text c="dimmed" p="lg">
            No machinery was recorded in this report.
          </Text>
        ) : (
          <TableScrollContainer minWidth={360}>
            <Table verticalSpacing="sm" horizontalSpacing="lg">
              <TableThead>
                <TableTr>
                  <Th>Category</Th>
                  <Th ta="right">Number in operation</Th>
                  <Th ta="right">Hours worked</Th>
                </TableTr>
              </TableThead>
              <TableTbody>
                {report.machineries.map((m) => (
                  <TableTr key={m.id}>
                    <TableTd fw={600}>{m.category}</TableTd>
                    <TableTd ta="right">{m.number}</TableTd>
                    <TableTd ta="right">{m.hours}</TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </TableScrollContainer>
        )}
      </Panel>

      <Panel title="Materials" description={`${report.materials.length} lines`} flush>
        {report.materials.length === 0 ? (
          <Text c="dimmed" p="lg">
            No materials were recorded in this report.
          </Text>
        ) : (
          <>
            <TableScrollContainer minWidth={520}>
              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <TableThead>
                  <TableTr>
                    <Th>Material</Th>
                    <Th ta="right">Quantity</Th>
                    <Th>Unit</Th>
                    <Th ta="right">Unit cost</Th>
                    <Th ta="right">Cost</Th>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {report.materials.map((m) => (
                    <TableTr key={m.id}>
                      <TableTd fw={600}>{m.name}</TableTd>
                      <TableTd ta="right">{m.quantity}</TableTd>
                      <TableTd>{m.unit}</TableTd>
                      <TableTd ta="right">{formatMoney(m.unitCost)}</TableTd>
                      <TableTd ta="right">{formatMoney(m.lineCost)}</TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            </TableScrollContainer>
            <Divider />
            <Group justify="space-between" px="lg" py="md">
              <Text fw={600}>Total</Text>
              <Text fw={700}>{formatMoney(report.materialsTotal)}</Text>
            </Group>
          </>
        )}
      </Panel>
      <Group justify="flex-end" gap="sm" mt="md">
  {actions}

  <Button
    component="a"
    href={`/api/reports/${report.id}/pdf`}
    variant="light"
    size="sm"
  >
    Download PDF
  </Button>
</Group>
    </AdminPage>
  );
}