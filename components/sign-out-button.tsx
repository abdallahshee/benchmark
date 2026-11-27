"use client";

import { signOut } from "@/app/login/actions";
import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const confirm = () =>
    modals.openConfirmModal({
      title: "Sign out?",
      children: <Text size="sm">You&apos;ll need to sign in again to access your account.</Text>,
      labels: { confirm: "Sign out", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => signOut(),
    });

  return (
    <Button
      variant="filled"
      onClick={confirm}
      color="red"
      leftSection={<LogOut size={16} />}
      className="self-start cursor-pointer"
    >
      Sign out
    </Button>
  );
}
