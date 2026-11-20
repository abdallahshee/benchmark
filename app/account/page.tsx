import { Alert, Avatar, Badge, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { Suspense } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { getAvatarUrl } from "@/lib/supabase/storage";

import { AvatarForm } from "./avatar-form";
import { SignOutButton } from "./sign-out-button";

export default function AccountPage() {
  return (
    <Stack component="main" gap="lg" p="xl" className="mx-auto w-full max-w-xl flex-1">
      <Title order={1}>Account</Title>
      <Suspense fallback={<Skeleton height={64} />}>
        <Account />
      </Suspense>
    </Stack>
  );
}

async function Account() {
  // proxy.ts already guards this route; checking here too keeps the page safe on its own.
  const user = await requireUser("/account");
  const avatarUrl = await getAvatarUrl(user.id);

  return (
    <>
      <Group>
        <Avatar src={avatarUrl} size="lg" radius="xl" alt="Avatar" />
        <div>
          <Group gap="xs">
            {user.fullName && <Text fw={600}>{user.fullName}</Text>}
            {user.role && <Badge variant="light">{ROLE_LABELS[user.role]}</Badge>}
          </Group>
          <Text size="sm" c="dimmed">
            {user.email}
          </Text>
        </div>
      </Group>
      {!user.role && (
        <Alert color="yellow" title="No role assigned">
          Your account doesn&apos;t have a role yet, so you can&apos;t access the app. Ask an
          admin to assign one.
        </Alert>
      )}
      {user.role === "admin" && (
        <AnchorLink href="/admin/users">
          Manage users →
        </AnchorLink>
      )}
      <AvatarForm />
      <SignOutButton />
    </>
  );
}
