
import {
  Anchor,
  Badge,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { displayName } from "@/lib/formats";
import type { WorkerDetails } from "@/lib/workers";

type WorkerDetailsProps = {
  worker: WorkerDetails;
};

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value || "—"}
      </Text>
    </Stack>
  );
}

export function WorkerDetails({ worker }: WorkerDetailsProps) {
  return (
    <Stack gap="lg">
      {/* Worker information */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Title order={3}>{displayName(worker)}</Title>
              <Text size="sm" c="dimmed">
                Worker information
              </Text>
            </Stack>

            <Badge variant="light" color="blue" size="lg">
              {worker.trade}
            </Badge>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <DetailItem label="First name" value={worker.firstName} />

            <DetailItem label="Last name" value={worker.lastName} />

            <DetailItem
              label="National ID number"
              value={worker.idNumber}
            />

            <DetailItem label="Trade" value={worker.trade} />

            <DetailItem label="Phone number" value={worker.phone} />

            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600}>
                Email address
              </Text>

              {worker.email ? (
                <Anchor href={`mailto:${worker.email}`} size="sm" fw={500}>
                  {worker.email}
                </Anchor>
              ) : (
                <Text size="sm" fw={500}>
                  —
                </Text>
              )}
            </Stack>

            <DetailItem
              label="Date registered"
              value={formatDate(worker.createdAt)}
            />

            <DetailItem
              label="Last updated"
              value={formatDate(worker.updatedAt)}
            />
          </SimpleGrid>
        </Stack>
      </Paper>

      {/* Assigned sites */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Stack gap={2}>
              <Title order={3}>Assigned sites</Title>
              <Text size="sm" c="dimmed">
                Construction sites where this worker is assigned.
              </Text>
            </Stack>

            <Badge variant="light" color="blue">
              {worker.assignedSites.length}{" "}
              {worker.assignedSites.length === 1 ? "site" : "sites"}
            </Badge>
          </Group>

          <Divider />

          {worker.assignedSites.length > 0 ? (
            <Stack gap="sm">
              {worker.assignedSites.map((site) => (
                <Group
                  key={site.id}
                  p="sm"
                  style={{
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text size="sm" fw={500}>
                    {site.name}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Stack align="center" gap="xs" py="lg">
              <Text fw={600}>No assigned sites</Text>
              <Text size="sm" c="dimmed" ta="center">
                This worker has not been assigned to any construction site.
              </Text>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
