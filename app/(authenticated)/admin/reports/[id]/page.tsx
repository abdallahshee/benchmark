import {
  Anchor,
  Divider,
  Group,
  SimpleGrid,
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AdminPage,
  Field,
  Panel,
  ReportStatusBadge,
  StatCard,
  Th,
} from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { displayName, formatDate, formatDateTime, formatMoney } from "@/lib/formats";
import { getReportById } from "../actions";


export const metadata: Metadata = { title: "Report" };

type PageProps = { params: Promise<{ id: string }> };

export default function ReportDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Report" back={{ href: "/admin/reports", label: "Reports" }}>
          <Skeleton height={400} radius="md" />
        </AdminPage>
      }
    >
      <ReportDetails params={params} />
    </Suspense>
  );
}

async function ReportDetails({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  const machineCount = report.machineries.reduce((n, m) => n + m.number, 0);

  return (
    <AdminPage
      title={report.siteName}
      description={`Report for ${formatDate(report.createdAt)}`}
      back={{ href: "/admin/reports", label: "Reports" }}
      actions={<ReportStatusBadge status={report.status} />}
    >
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
            <Anchor component={Link} href={`/admin/sites/${report.siteId}`} size="sm">
              {report.siteName}
            </Anchor>
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
            <Text size="sm">{formatDate(report.reportDate)}</Text>
          </Field>
          <Field label="Created">
            <Text size="sm">{formatDateTime(report.createdAt)}</Text>
          </Field>
          <Field label="Submitted">
            <Text size="sm">{report.createdAt ? formatDateTime(report.createdAt) : "—"}</Text>
          </Field>
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