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
  fullName: string | null;
  role: Role | null;
  lastSignInAt: string | null;
};

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function notify(result: ActionResult) {
  if (result.ok) notifications.show({ color: "green", message: result.message });
  else notifications.show({ color: "red", title: "Something went wrong", message: result.error });
}

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();

  const onRoleChange = (user: UserRow, value: string | null) => {
    if (!value || value === user.role) return;
    startTransition(async () => notify(await changeRole(user.id, value as Role)));
  };

  const onDelete = (user: UserRow) =>
    modals.openConfirmModal({
      title: "Delete user?",
      children: (
        <Text size="sm">
          This permanently deletes <strong>{user.email}</strong> and their profile.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => startTransition(async () => notify(await deleteUser(user.id))),
    });

  return (
    <Table.ScrollContainer minWidth={640}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={180}>Role</Table.Th>
            <Table.Th w={50} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td>
                {user.fullName ?? "—"}
                {user.id === currentUserId && (
                  <Text span c="dimmed" size="sm">
                    {" "}
                    (you)
                  </Text>
                )}
              </Table.Td>
              <Table.Td>{user.email}</Table.Td>
              <Table.Td>
                {user.lastSignInAt ? (
                  <Badge color="green" variant="light">
                    Active
                  </Badge>
                ) : (
                  <Badge color="yellow" variant="light">
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
                {user.id !== currentUserId && (
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
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
