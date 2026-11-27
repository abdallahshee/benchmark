
"use client";

import {
  Button,
  Group,
  Table,
  Text,
} from "@mantine/core";
import Link from "next/link";

export type UserRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  phone: string;
  lastSignInAt: string | null;
};

type UsersTableProps = {
  users: UserRow[];
  currentUserId: string;
  searching?: boolean;
};

const thProps = {
  fz: "xs",
  tt: "uppercase",
  fw: 600,
  c: "dimmed",
} as const;

export function UsersTable({
  users,
  currentUserId,
  searching = false,
}: UsersTableProps) {
  // Admins and the currently signed-in user are excluded.
  const visibleUsers = users.filter(
    (user) => user.id !== currentUserId && user.role !== "admin"
  );

  return (
    <Table.ScrollContainer minWidth={850}>
      <Table
        verticalSpacing="sm"
        horizontalSpacing="lg"
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th {...thProps}>First name</Table.Th>
            <Table.Th {...thProps}>Last name</Table.Th>
            <Table.Th {...thProps}>Email</Table.Th>
            <Table.Th {...thProps}>Phone</Table.Th>
            <Table.Th {...thProps}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {visibleUsers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center" py="md">
                  {searching
                    ? "No users match your search."
                    : "No other users yet."}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visibleUsers.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td fw={600}>
                  {user.firstName || "—"}
                </Table.Td>

                <Table.Td fw={600}>
                  {user.lastName || "—"}
                </Table.Td>

                <Table.Td>
                  {user.email ?? "—"}
                </Table.Td>

                <Table.Td>
                  {user.phone || "—"}
                </Table.Td>

                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      component={Link}
                      href={`/admin/users/${user.id}`}
                      size="xs"
                      variant="light"
                    >
                      View Details
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
