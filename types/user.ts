import { ROLES } from "./enums";

export type Role = (typeof ROLES)[number];


export const ROLE_LABELS: Record<Role, string> = {
  admin: "admin",
  foreman: "foreman",
  secretary: "secretary",
  // worker:"worker"
};


export type SiteRole="foreman"|"secretary"

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};