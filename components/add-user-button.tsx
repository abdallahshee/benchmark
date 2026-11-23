"use client";

import { Button, Tooltip } from "@mantine/core";
import Link from "next/link";

type AddUserButtonProps = {
  href: string;
  // When set, the button is switched off and shows this text on hover or focus.
  disabledReason?: string;
};

export function AddUserButton({ href, disabledReason }: AddUserButtonProps) {
  if (disabledReason) {
    return (
      <Tooltip label={disabledReason} multiline w={260} withArrow events={{ hover: true, focus: true, touch: true }}>
        {/* data-disabled keeps the tooltip working, which a truly disabled button would block. */}
        <Button data-disabled onClick={(e) => e.preventDefault()}>
          Add user
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button component={Link} href={href}>
      Add user
    </Button>
  );
}