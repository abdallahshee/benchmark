
import {
  Anchor,
  Badge,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminPage,
  Avatar,
  Panel,
  initialsOf,
} from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/formats";

import { getAllWorkers } from "./actions";

export const metadata: Metadata = {
  title: "Workers",
};

export default function WorkersPage() {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Workers"
          description="All registered construction workers"
        >
          <Skeleton height={400} radius="md" />
        </AdminPage>
      }
    >
      <WorkersContent />
    </Suspense>
  );
}

async function WorkersContent() {
  await requireRole("admin");

  const workers = await getAllWorkers();

  return (
    <AdminPage
      title="Workers"
      description="View all registered construction workers across your sites"
    >
      <Panel
        title={`Worker directory (${workers.length})`}
        description="All workers registered in the system"
        flush
      >
        {workers.length === 0 ? (
          <Stack align="center" gap="xs" p="xl">
            <Text fw={600}>No workers found</Text>
            <Text size="sm" c="dimmed" ta="center">
              Registered workers will appear here.
            </Text>
          </Stack>
        ) : (
          <ScrollArea>
            <Table
              striped
              highlightOnHover
              verticalSpacing="sm"
              horizontalSpacing="md"
              miw={1000}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Worker</Table.Th>
                  <Table.Th>ID Number</Table.Th>
                  <Table.Th>Trade</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Assigned Site(s)</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {workers.map((worker) => (
                  <Table.Tr key={worker.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="yellow" radius="xl">
                          {initialsOf(worker)}
                        </Avatar>

                        <Text fw={600} size="sm" style={{ whiteSpace: "nowrap" }}>
                          {displayName(worker)}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {worker.idNumber}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {worker.trade}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      {worker.phone ? (
                        <Anchor href={`tel:${worker.phone}`} size="sm">
                          {worker.phone}
                        </Anchor>
                      ) : (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {worker.email ? (
                        <Anchor href={`mailto:${worker.email}`} size="sm">
                          {worker.email}
                        </Anchor>
                      ) : (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {worker.siteNames ? (
                        <Text size="sm" maw={220}>
                          {worker.siteNames}
                        </Text>
                      ) : (
                        <Badge color="gray" variant="light">
                          Unassigned
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Panel>
    </AdminPage>
  );
}
