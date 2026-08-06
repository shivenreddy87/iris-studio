/**
 * Server-side validation for stored object paths.
 *
 * Clients submit storage paths (not files) to server functions, so every write
 * path that persists a storage reference must confirm the object belongs to the
 * caller and lives in the expected bucket.
 */

export type StorageBucket = "avatars" | "campaign-attachments" | "payout-documents";

const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-zA-Z-]{36}\.[a-z0-9]{1,8}$/;

/**
 * Ensures a submitted path is `<callerId>/<uuid>.<ext>`. Returns the path so it
 * can be inlined into an insert/update payload.
 */
export function assertOwnedStoragePath(
  path: string | null | undefined,
  userId: string,
): string | null {
  if (!path) return null;
  if (!PATH_PATTERN.test(path) || !path.startsWith(`${userId}/`)) {
    throw new Error("That file reference is not valid. Please upload the file again.");
  }
  return path;
}

/** Signed URL lifetime used by every server-issued download link. */
export const SIGNED_URL_TTL_SECONDS = 60 * 15;

export async function signedUrlFor(
  bucket: StorageBucket,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
