import { SITE_ROLES } from "@/lib/site-roles";
import { z } from "zod";

export const InviteSiteUserSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name cannot exceed 50 characters"),

    lastName: z
        .string()
        .trim()
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name cannot exceed 50 characters"),

    email: z
        .email("Enter a valid email address"),

    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password cannot exceed 128 characters"),
});

export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),

});


export const ChangePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain a special character",
      ),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordRequest = z.infer<
  typeof ChangePasswordSchema
>;



// export type InviteInput = z.infer<typeof InviteInputSchema>;

export type LoginRequest = z.infer<typeof LoginSchema>;
export type InviteSiteUserRequest = z.infer<typeof InviteSiteUserSchema>;


// The form's fields plus the site. The role is not part of it: it is fixed by which action
// is called (inviteForeman or inviteSecretary), so the browser can't forge it.
export const InviteInputSchema = InviteSiteUserSchema.extend({
  siteId: z.uuid("Invalid site"),
});

export type InviteInput = z.infer<typeof InviteInputSchema>;