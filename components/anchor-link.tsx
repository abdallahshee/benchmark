"use client";

import { Anchor, type AnchorProps } from "@mantine/core";
import Link from "next/link";

// Mantine Anchor rendered as a Next.js Link. A client component so it can be used
// from Server Components (which can't pass the Link function as a prop).
export function AnchorLink({
  href,
  children,
  ...props
}: AnchorProps & { href: string; children: React.ReactNode }) {
  return (
    <Anchor component={Link} href={href} {...props}>
      {children}
    </Anchor>
  );
}
