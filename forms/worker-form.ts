import { z } from "zod";

// Suggestions keep trades consistent; any other trade can still be typed.


export const AddWorkerSchema = z.object({
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
  idNumber: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{5,20}$/, "Enter a valid ID number (5 to 20 letters or digits)"),
  // Spaces and dashes are allowed while typing and removed before saving.
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{9,18}$/, "Enter a valid phone number")
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 9 && digits <= 15;
    }, "Enter a valid phone number"),
  // Optional: an empty string means no email.
  email: z
    .string()
    .trim()
    .max(120, "Email cannot exceed 120 characters")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
  trade: z
    .string()
    .trim()
    .min(2, "Enter the worker's trade")
    .max(40, "Trade cannot exceed 40 characters"),
});

export type AddWorkerInput = z.infer<typeof AddWorkerSchema>;