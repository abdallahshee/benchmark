import z from "zod"

export const inviteStaffSchema = z.object({
  siteId: z.string(),
  firstName: z.string().trim().min(1, "Enter a first name").max(60),
  lastName: z.string().trim().min(1, "Enter a last name").max(60),
  email: z.string().trim().toLowerCase(),
  phone: z.string().trim().regex(/^(\+?[0-9\s-]{7,15})?$/, "Enter a valid phone number"),
//   role: z.enum(["foreman", "secretary"]),
});

export const inviteUser = z.object({
  siteId: z.string(),
  firstName: z.string().trim().min(1, "Enter a first name").max(60),
  lastName: z.string().trim().min(1, "Enter a last name").max(60),
  email: z.string().trim().toLowerCase(),
  phone: z.string().trim().regex(/^(\+?[0-9\s-]{7,15})?$/, "Enter a valid phone number"),
  role: z.enum(["foreman", "secretary"]),
});