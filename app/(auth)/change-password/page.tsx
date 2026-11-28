import type { Metadata } from "next";
import { Text } from "@mantine/core";
import { requirePasswordChangeUser } from "@/lib/auth";

import { ChangePasswordForm } from "./change-password-form";
import { AuthLayout } from "../auth-layout";

export const metadata: Metadata = {
  title: "Change Password",
};

export default async function ChangePasswordPage() {
  const user = await requirePasswordChangeUser();

  return (
    <AuthLayout
      title="Set a new password"
      description="Your account requires a password update before you can continue."
    >
      <Text size="sm" fw={500} mb="md">
        {user.email}
      </Text>

      <ChangePasswordForm />
    </AuthLayout>
  );
}