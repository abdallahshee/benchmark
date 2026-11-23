"use client";

import { CloseButton, Loader, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function UsersSearch({ q }: { q: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(q);

  // Wait until the person pauses typing, then put the search in the URL.
  useEffect(() => {
    const next = value.trim();
    if (next === q) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(next ? `/admin/users?q=${encodeURIComponent(next)}` : "/admin/users");
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [value, q, router]);

  return (
    <TextInput
      aria-label="Search users"
      placeholder="Search by email or phone"
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      w={{ base: "100%", sm: 280 }}
      rightSection={
        pending ? (
          <Loader size="xs" />
        ) : value ? (
          <CloseButton size="sm" aria-label="Clear search" onClick={() => setValue("")} />
        ) : null
      }
    />
  );
}