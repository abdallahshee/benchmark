// Shared by client and server code. Keep in sync with the `user_role` enum in db/schema/profiles.ts.

import { ROLES } from "@/types/enums";
import { Role } from "@/types/user";


export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
