"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { changePassword } from "./actions";



export function ChangePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    setError("");

    startTransition(async () => {
      const result = await changePassword({
        password,
        confirmPassword,
      });

      if (!result.ok) {
        setError(result.error);
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
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert color="red" title="Unable to change password">
          {error}
        </Alert>
      )}

      <PasswordInput
        label="New password"
        placeholder="Enter your new password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        required
        autoComplete="new-password"
      />

      <PasswordInput
        label="Confirm new password"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChange={(event) =>
          setConfirmPassword(event.currentTarget.value)
        }
        required
        autoComplete="new-password"
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
        onClick={handleSubmit}
        loading={isPending}
        disabled={!password || !confirmPassword}
      >
        Change password
      </Button>
    </Stack>
  );
}