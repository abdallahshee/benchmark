"use client"
import { Button, type ButtonProps } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";

type LinkButtonProps = ButtonProps & {
  href: string;
  children?: ReactNode;
};

// A Mantine Button that navigates with next/link. The "use client" boundary lets the
// Link function be passed to Button here, which a Server Component can't do.
export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}