"use client";

import { Button, Select, SimpleGrid, TextInput } from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTransition } from "react";
import { inviteUser } from "./actions";
import { ROLES } from "@/types/enums";
import { Role, ROLE_LABELS } from "@/types/user";

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function InviteForm() {
  const [pending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: null as Role | null,
    },
    validate: {
      firstName: (v) => (v.trim() ? null : "Enter a first name"),
      lastName: (v) => (v.trim() ? null : "Enter a last name"),
      email: isEmail("Enter a valid email"),
      // Optional, but if given it must look like a phone number.
      phone: (v) =>
        !v.trim() || /^\+?[0-9\s-]{7,15}$/.test(v.trim()) ? null : "Enter a valid phone number",
      role: (v) => (v ? null : "Select a role"),
    },
  });

  const onSubmit = form.onSubmit(({ firstName, lastName, email, phone, role }) =>
    startTransition(async () => {
      const result = await inviteUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role!, // validated above
      });
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
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <TextInput
          label="First name"
          autoComplete="off"
          key={form.key("firstName")}
          {...form.getInputProps("firstName")}
        />
        <TextInput
          label="Last name"
          autoComplete="off"
          key={form.key("lastName")}
          {...form.getInputProps("lastName")}
        />
        <TextInput
          label="Email"
          type="email"
          autoComplete="off"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <TextInput
          label="Phone"
          type="tel"
          placeholder="+254 700 000000"
          autoComplete="off"
          key={form.key("phone")}
          {...form.getInputProps("phone")}
        />
        <Select
          label="Role"
          placeholder="Select a role"
          data={roleOptions}
          allowDeselect={false}
          key={form.key("role")}
          {...form.getInputProps("role")}
        />
      </SimpleGrid>
      <Button type="submit" loading={pending} mt="md">
        Send invite
      </Button>
    </form>
  );
}