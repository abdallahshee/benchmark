"use client";

import { Role, ROLE_LABELS, ROLES } from "@/types/user";
import { Button, Group, Select, TextInput } from "@mantine/core";
import {  useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTransition } from "react";
import { inviteUser } from "./actions";


const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function InviteForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { fullName: "", email: "", role: null as Role | null },
    validate: {
    
    },
  });

  const onSubmit = form.onSubmit(({ fullName, email, role }) =>
    startTransition(async () => {
      const result = await inviteUser({ fullName, email, role: role! });
      if (result.ok) {
        notifications.show({ color: "green", message: result.message });
        form.reset();
      } else {
        notifications.show({ color: "red", title: "Invite failed", message: result.error });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Group align="flex-start" grow>
        <TextInput label="Full name" key={form.key("fullName")} {...form.getInputProps("fullName")} />
        <TextInput
          label="Email"
          type="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <Select
          label="Role"
          data={roleOptions}
          key={form.key("role")}
          {...form.getInputProps("role")}
        />
      </Group>
      <Button type="submit" loading={pending} mt="md">
        Send invite
      </Button>
    </form>
  );
}
