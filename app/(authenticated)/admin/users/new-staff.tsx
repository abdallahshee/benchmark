"use client";

import { Button, Group, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { inviteForeman, inviteSecretary } from "./actions";

type SiteRole = "foreman" | "secretary";

type InviteInput = {
  siteId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Props = {
  siteId: string;
  role: SiteRole;
};

function SiteUserForm({ siteId, role }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    validate: {
      firstName: (v) => (v.trim() ? null : "Enter a first name"),
      lastName: (v) => (v.trim() ? null : "Enter a last name"),
      email: isEmail("Enter a valid email"),
      phone: (v) =>
        !v.trim() || /^\+?[0-9\s-]{7,15}$/.test(v.trim())
          ? null
          : "Enter a valid phone number",
    },
  });

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const input: InviteInput = {
        siteId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      };

      const result =
        role === "foreman"
          ? await inviteForeman(input)
          : await inviteSecretary(input);

      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Could not add user",
          message: result.error,
        });
        return;
      }

      notifications.show({
        color: "green",
        message: result.message,
      });

      router.push(`/admin/sites/${siteId}`);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="First name"
            autoComplete="given-name"
            key={form.key("firstName")}
            {...form.getInputProps("firstName")}
          />

          <TextInput
            label="Last name"
            autoComplete="family-name"
            key={form.key("lastName")}
            {...form.getInputProps("lastName")}
          />

          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />

          <TextInput
            label="Phone"
            type="tel"
            placeholder="+254 700 000000"
            autoComplete="tel"
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>

          <Button type="submit" loading={pending}>
            Invite {role}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function NewForemanForm({ siteId }: { siteId: string }) {
  return <SiteUserForm siteId={siteId} role="foreman" />;
}

export function NewSecretaryForm({ siteId }: { siteId: string }) {
  return <SiteUserForm siteId={siteId} role="secretary" />;
}