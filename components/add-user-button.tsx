"use client";

import { Button, Tooltip } from "@mantine/core";
import { useRouter } from "next/navigation";

type AddUserButtonProps = {
  href: string;
  label: string;
  color: string;
  disabledReason?: string;
};

export function AddUserButton({
  href,
  label,
  color,
  disabledReason,
}: AddUserButtonProps) {
  const router = useRouter();
  const disabled = Boolean(disabledReason);

  const button = (
    <Button
      color={color}
      disabled={disabled}
      onClick={() => router.push(href)}
    >
      {label}
    </Button>
  );

  if (disabledReason) {
    return (
      <Tooltip label={disabledReason}>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}