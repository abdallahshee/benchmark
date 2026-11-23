"use client";

import { Button, Group, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ROLE_LABELS } from "@/types/user";
import { inviteSiteUser } from "./actions";

// The only roles that can be added to a site.
const SITE_ROLES = ["foreman", "secretary"] as const;
type SiteRole = (typeof SITE_ROLES)[number];

const roleOptions = SITE_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function NewSiteUserForm({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: null as SiteRole | null,
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

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const result = await inviteSiteUser({
        siteId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        role: values.role!, // validated above, and typed as foreman | secretary
      });
      if (!result.ok) {
        notifications.show({ color: "red", title: "Could not add user", message: result.error });
        return;
      }
      notifications.show({ color: "green", message: result.message });
      router.push(`/admin/sites/${siteId}`);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
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

        <Group justify="flex-end">
          <Button variant="default" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Send invite
          </Button>
        </Group>
      </Stack>
    </form>
  );
}