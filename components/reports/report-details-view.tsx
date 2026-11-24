import {
  Alert,
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

import {
  AdminPage,
  Field,
  Panel,
  ReportStatusBadge,
  StatCard,
  Th,
} from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import type { ReportDetails } from "@/lib/queries/report-details";
import { displayName, formatDate, formatDateTime, formatMoney } from "@/lib/formats";

type Props = {
  report: ReportDetails;
  back: { href: string; label: string };
  // Only the admin has a site page to link to.
  siteHref?: string;
  // Extra buttons next to the status, for example the secretary's approve and reject.
  actions?: ReactNode;
};

export function ReportDetailsView({ report, back, siteHref, actions }: Props) {
  const machineCount = report.machineries.reduce((n, m) => n + m.number, 0);

  return (
    <AdminPage
      title={report.siteName}
      description={`Report for ${formatDate(report.createdAt)}`}
      back={back}
      actions={
        <Group gap="sm">
          <ReportStatusBadge status={report.status} />
          {actions}
        </Group>
      }
    >
      {/* {report.status === "rejected" && (
        <Alert color="red" variant="light" title="This report was rejected">
          {report.rejectionReason || "No reason was given."}
        </Alert>
      )} */}

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard label="Machines in operation" value={machineCount} icon="gear" color="orange" />
        <StatCard label="Material lines" value={report.materials.length} icon="reports" color="blue" />
        <StatCard
          label="Materials cost"
          value={formatMoney(report.materialsTotal)}
          icon="money"
          color="green"
        />
      </SimpleGrid>

      <Panel title="Summary">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
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
            <Text size="sm">{formatDate(report.createdAt)}</Text>
          </Field>
          <Field label="Created">
            <Text size="sm">{formatDateTime(report.createdAt)}</Text>
          </Field>
          {/* <Field label="Sent to the secretary">
            <Text size="sm">{report.submittedAt ? formatDateTime(report.submittedAt) : "Not sent yet"}</Text>
          </Field> */}
        </SimpleGrid>
        <Divider my="md" />
        <Field label="Notes">
          <Text size="sm" c={report.notes ? undefined : "dimmed"} style={{ whiteSpace: "pre-wrap" }}>
            {report.notes || "No notes."}
          </Text>
        </Field>
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
    </AdminPage>
  );
}