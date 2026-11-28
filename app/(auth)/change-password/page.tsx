import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, Text } from "@mantine/core";

import { requirePasswordChangeUser } from "@/lib/auth";

import { ChangePasswordForm } from "./change-password-form";
import { AuthLayout } from "../auth-layout";

export const metadata: Metadata = {
  title: "Change Password",
};

// This component accesses request-specific authentication data.
async function ChangePasswordContent() {
  const user = await requirePasswordChangeUser();

  return (
    <>
      <Text size="sm" fw={500} mb="md">
        {user.email}
      </Text>

      <ChangePasswordForm />
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      description="Your account requires a password update before you can continue."
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton height={18} width="60%" />
            <Skeleton height={42} />
            <Skeleton height={42} />
            <Skeleton height={42} />
          </div>
        }
      >
        <ChangePasswordContent />
      </Suspense>
    </AuthLayout>
  );
}