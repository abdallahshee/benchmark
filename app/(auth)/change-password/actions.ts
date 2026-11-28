"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePasswordChangeUser } from "@/lib/auth";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const ChangePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must contain at least 12 characters.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number.")
      .regex(/[^A-Za-z0-9]/, "Include a special character."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function changePassword(
  input: unknown,
): Promise<ActionResult> {
  const user = await requirePasswordChangeUser();

  const parsed = ChangePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
    app_metadata: {
      ...user.app_metadata,
      must_change_password: false,
    },
  });

  if (error) {
    return {
      ok: false,
      error: "Could not update your password. Please try again.",
    };
  }

  return {
    ok: true,
    message: "Password changed successfully.",
  };
}