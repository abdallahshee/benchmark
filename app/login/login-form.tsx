"use client";

import { Alert, Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { signIn } from "./actions";


export function LoginForm() {
  const searchParams = useSearchParams();
  // const next = searchParams.get("next") ?? "/undefined";
  const next = searchParams.get("next") ?? undefined;
  const linkFailed = searchParams.get("error") === "confirmation_failed";
  const [pending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "", password: "" },
    validate: {
      // email: isEmail("Enter a valid email"),
      // password: isNotEmpty("Enter your password"),
    },
  });

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      // On success the action redirects, so a result means it didn't go through.
      const result = await signIn({ ...values, next });
      if (result?.error) {
        notifications.show({ color: "red", title: "Sign-in failed", message: result.error });
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
