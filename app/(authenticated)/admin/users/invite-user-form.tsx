
"use client";

import { Button, Group, PasswordInput, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { inviteForeman, inviteSecretary } from "./actions";
import { InviteSiteUserRequest, InviteSiteUserSchema } from "@/forms/user-forms";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { SiteRole } from "@/types/user";



type Props = {
  siteId: string;
  role: SiteRole;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function NewSiteUserForm({
  siteId,
  role,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<InviteSiteUserRequest>({
    mode: "uncontrolled",
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: ""
    },
    validate: zod4Resolver(InviteSiteUserSchema)
  });

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const input = {
        siteId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/admin/sites/${siteId}/users`);
        router.refresh();
      }
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

          <PasswordInput
            label="Temporary password"
            autoComplete="new-password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button
            type="button"
            variant="default"
            onClick={onCancel ?? (() => router.back())}
            disabled={pending}
          >
            Cancel
          </Button>

          <Button type="submit" loading={pending}>
            Send {role} invitation
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
