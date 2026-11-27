
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  Anchor,
  Button,
  Group,
  Pagination,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import { Avatar, initialsOf } from "@/components/admin-ui";
import { displayName } from "@/lib/formats";
import type { SiteWorker } from "@/lib/workers";
import { Role } from "@/types/user";

const PAGE_SIZE = 10;


type SiteWorkersTableProps = {
  workers: SiteWorker[];
  user: {
    role: Role;
  };
};

const workerDetailsPath = (role: Role, workerId: string) =>
  `/${role}/workers/${workerId}`;

export function SiteWorkersTable({
  workers,
  user,
}: SiteWorkersTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(workers.length / PAGE_SIZE);

  const paginatedWorkers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return workers.slice(start, start + PAGE_SIZE);
  }, [workers, page]);

  const firstItem = (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, workers.length);

  if (workers.length === 0) {
    return (
      <Stack align="center" gap="xs" p="xl">
        <Text fw={600}>No workers assigned</Text>
        <Text size="sm" c="dimmed" ta="center">
          Workers assigned to this site will appear here.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      <div style={{ padding: "16px 20px 20px" }}>
        <ScrollArea type="auto">
          <Table
            striped
            highlightOnHover
            verticalSpacing="md"
            horizontalSpacing="lg"
            miw={720}
            layout="fixed"
          >
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>

            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Worker</th>
                <th style={{ textAlign: "left" }}>Trade</th>
                <th style={{ textAlign: "left" }}>Phone number</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedWorkers.map((worker) => (
                <tr key={worker.id}>
                  <td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar color="yellow" radius="xl">
                        {initialsOf(worker)}
                      </Avatar>

                      <Text size="sm" fw={500} truncate>
                        {displayName(worker)}
                      </Text>
                    </Group>
                  </td>

                  <td>
                    <Text size="sm">{worker.trade}</Text>
                  </td>

                  <td>
                    {worker.phone ? (
                      <Anchor
                        href={`tel:${worker.phone}`}
                        size="sm"
                        underline="never"
                      >
                        {worker.phone}
                      </Anchor>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </td>

                  <td>
                    <Group justify="flex-end">
                      <Button
                        component={Link}
                        href={workerDetailsPath(user.role, worker.id)}
                        variant="light"
                        color="blue"
                        size="xs"
                      >
                        View
                      </Button>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
      </div>

      {totalPages > 1 && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--mantine-color-default-border)",
            }}
          />

          <Group
            justify="space-between"
            align="center"
            px="lg"
            py="md"
            wrap="wrap"
          >
            <Text size="xs" c="dimmed">
              Showing {firstItem}–{lastItem} of {workers.length} workers
            </Text>

            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              radius="md"
            />
          </Group>
        </>
      )}
    </Stack>
  );
}
