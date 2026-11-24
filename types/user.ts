import { ROLES } from "./enums";

export type Role = (typeof ROLES)[number];


export const ROLE_LABELS: Record<Role, string> = {
  admin: "admin",
  foreman: "foreman",
  secretary: "secretary",
  worker:"worker"
};
// import type { Role } from "@/types/user";

// Where each role lands after signing in, and the only area it may use.


export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};