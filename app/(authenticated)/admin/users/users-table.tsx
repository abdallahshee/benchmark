"use client";

import { Role, ROLE_LABELS } from "@/types/user";
import { ActionIcon, Badge, Select, Table, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useTransition } from "react";
import { ActionResult, changeRole, deleteUser } from "./actions";
import { ROLES } from "@/types/enums";

export type UserRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role | null;
  phone: string;
  lastSignInAt: string | null;
};

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function notify(result: ActionResult) {
  if (result.ok) notifications.show({ color: "green", message: result.message });
  else notifications.show({ color: "red", title: "Something went wrong", message: result.error });
}

const thProps = { fz: "xs", tt: "uppercase", fw: 600, c: "dimmed" } as const;

type UsersTableProps = {
  users: UserRow[];
  currentUserId: string;
  // True when the list is a search result, so an empty table says so.
  searching?: boolean;
};

export function UsersTable({ users, currentUserId, searching = false }: UsersTableProps) {
  const [pending, startTransition] = useTransition();

  // Admins and the signed-in user are never listed, so neither can be changed or deleted here.
  const visibleUsers = users.filter((u) => u.id !== currentUserId && u.role !== "admin");

  const onRoleChange = (user: UserRow, value: string | null) => {
    if (!value || value === user.role) return;
    startTransition(async () => notify(await changeRole(user.id, value as Role)));
  };

  const onDelete = (userToDelete: UserRow) =>
    modals.openConfirmModal({
      title: "Delete user?",
      children: (
        <Text size="sm">
          This permanently deletes <strong>{userToDelete.email}</strong> and their profile.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => startTransition(async () => notify(await deleteUser(userToDelete.id))),
    });

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th {...thProps}>First name</Table.Th>
            <Table.Th {...thProps}>Last name</Table.Th>
            <Table.Th {...thProps}>Email</Table.Th>
            <Table.Th {...thProps}>Phone</Table.Th>
            <Table.Th {...thProps}>Status</Table.Th>
            <Table.Th {...thProps} w={180}>
              Role
            </Table.Th>
            <Table.Th w={50} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleUsers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text c="dimmed" ta="center" py="md">
                  {searching ? "No users match your search." : "No other users yet."}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visibleUsers.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td fw={600}>{user.firstName || "—"}</Table.Td>
                <Table.Td fw={600}>{user.lastName || "—"}</Table.Td>
                <Table.Td>{user.email ?? "—"}</Table.Td>
                <Table.Td>{user.phone || "—"}</Table.Td>
                <Table.Td>
                  {user.lastSignInAt ? (
                    <Badge color="green" variant="dot">
                      Active
                    </Badge>
                  ) : (
                    <Badge color="yellow" variant="dot">
                      Invited
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Select
                    data={roleOptions}
                    value={user.role}
                    placeholder="No role"
                    disabled={pending}
                    allowDeselect={false}
                    onChange={(value) => onRoleChange(user, value)}
                    aria-label={`Role for ${user.email}`}
                  />
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Delete user">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={pending}
                      onClick={() => onDelete(user)}
                      aria-label={`Delete ${user.email}`}
                    >
                      ✕
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}