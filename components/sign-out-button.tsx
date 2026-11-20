"use client";

import { signOut } from "@/app/account/actions";
import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";

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
    <Button variant="default" onClick={confirm} className="self-start">
      Sign out
    </Button>
  );
}
