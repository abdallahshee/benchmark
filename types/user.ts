export const ROLES = ["admin", "foreman", "secretary"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  foreman: "Foreman",
  secretary: "Secretary",
};

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};