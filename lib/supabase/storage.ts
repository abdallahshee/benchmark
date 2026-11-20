import "server-only";

import { createClient } from "./server";

export const AVATARS_BUCKET = "avatars";

// Files live under `<user id>/...` so storage RLS policies can scope access per user
// (see drizzle/0001_storage_avatars.sql).
export function avatarPath(userId: string) {
  return `${userId}/avatar`;
}

// The avatars bucket is private, so files are served through short-lived signed URLs.
export async function getAvatarUrl(userId: string, expiresIn = 60 * 60) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(avatarPath(userId), expiresIn);
  return error ? null : data.signedUrl;
}
