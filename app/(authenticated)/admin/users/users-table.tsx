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
  phone:string,
  lastSignInAt: string | null;
};

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function notify(result: ActionResult) {
  if (result.ok) notifications.show({ color: "green", message: result.message });
  else notifications.show({ color: "red", title: "Something went wrong", message: result.error });
}

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();

  // The signed-in user is not listed, so they can't change or delete themselves here.
 // Admins and the signed-in user are never listed, so neither can be changed or deleted here.
const visibleUsers = users.filter((u) => u.id !== currentUserId && u.role !== "admin");

  const onRoleChange = (user: UserRow, value: string | null) => {
    if (!value || value === user.role) return;
    startTransition(async () => notify(await changeRole(user.id, value as Role)));
  };

  const onDelete = (usetoDelete: UserRow) =>
    modals.openConfirmModal({
      title: "Delete user?",
      children: (
        <Text size="sm">
          This permanently deletes <strong>{usetoDelete.email}</strong> and their profile.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => startTransition(async () => notify(await deleteUser(usetoDelete.id))),
    });

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>First name</Table.Th>
            <Table.Th>Last name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={180}>Role</Table.Th>
            <Table.Th w={50} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleUsers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center" py="md">
                  No other users yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visibleUsers.map((theUser) => (
              <Table.Tr key={theUser.id}>
                <Table.Td>{theUser.firstName ?? "—"}</Table.Td>
                <Table.Td>{theUser.lastName ?? "—"}</Table.Td>
                <Table.Td>{theUser.email ?? "—"}</Table.Td>
                <Table.Td>{theUser.phone ?? "—"}</Table.Td>
                <Table.Td>
                  {theUser.lastSignInAt ? (
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
                    value={theUser.role}
                    placeholder="No role"
                    disabled={pending}
                    allowDeselect={false}
                    onChange={(value) => onRoleChange(theUser, value)}
                    aria-label={`Role for ${theUser.email}`}
                  />
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Delete user">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={pending}
                      onClick={() => onDelete(theUser)}
                      aria-label={`Delete ${theUser.email}`}
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