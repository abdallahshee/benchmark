
"use client";

import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { LoginRequest, LoginSchema } from "@/forms/user-forms";
import { signIn } from "./actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const linkFailed = searchParams.get("error") === "confirmation_failed";
  const [pending, startTransition] = useTransition();

  const form = useForm<LoginRequest>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },
    validate: zodResolver(LoginSchema),
  });

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const result = await signIn({ ...values, next });

      if (result?.error) {
        notifications.show({
          color: "red",
          title: "Sign-in failed",
          message: result.error,
        });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate>
      <Stack>
        {linkFailed && (
          <Alert color="red" title="Link expired">
            That link is invalid or has expired.
          </Alert>
        )}

        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />

        <Button type="submit" loading={pending}>
          Sign in
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Accounts are created by invitation. Contact an admin if you need access.
        </Text>
      </Stack>
    </form>
  );
}
