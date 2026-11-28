"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";

import {
  ChangePasswordRequest,
  ChangePasswordSchema,
} from "@/forms/user-forms";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordRequest>({
    mode: "uncontrolled",
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: zod4Resolver(ChangePasswordSchema),
    validateInputOnBlur:true
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await changePassword(values);

      if (!result.ok) {
        notifications.show({
          title: "Unable to change password",
          message: result.error,
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Password updated",
        message: result.message,
        color: "green",
      });

      router.replace("/");
      router.refresh();
    });
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <PasswordInput
          label="New password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />

        <PasswordInput
          label="Confirm new password"
          placeholder="Confirm your new password"
          autoComplete="new-password"
          key={form.key("confirmPassword")}
          {...form.getInputProps("confirmPassword")}
        />

        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Your password must have:
          </Text>
          <Text size="xs" c="dimmed">
            • At least 12 characters
          </Text>
          <Text size="xs" c="dimmed">
            • An uppercase and lowercase letter
          </Text>
          <Text size="xs" c="dimmed">
            • A number and a special character
          </Text>
        </Stack>

        <Button
          fullWidth
          type="submit"
          loading={isPending}
        >
          Change password
        </Button>
      </Stack>
    </form>
  );
}