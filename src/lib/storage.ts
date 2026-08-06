/**
 * Centralised storage helpers.
 *
 * All uploads in the app go through `uploadToBucket`, which enforces the
 * per-bucket type and size rules and produces a user-scoped object path
 * (`<userId>/<uuid>.<ext>`). Server-side validation of the resulting path
 * lives in `storage.server.ts`.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StorageBucket = "avatars" | "campaign-attachments" | "payout-documents";

type BucketRule = {
  maxBytes: number;
  mimeTypes: string[];
  accept: string;
  label: string;
};

export const BUCKET_RULES: Record<StorageBucket, BucketRule> = {
  avatars: {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    accept: ".png,.jpg,.jpeg,.webp",
    label: "PNG, JPG or WEBP, up to 5MB",
  },
  "campaign-attachments": {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    accept: ".png,.jpg,.jpeg,.webp,.pdf",
    label: "PNG, JPG, WEBP or PDF, up to 10MB",
  },
  "payout-documents": {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg", "application/pdf"],
    accept: ".png,.jpg,.jpeg,.pdf",
    label: "PNG, JPG or PDF, up to 5MB",
  },
};

/** Signed URLs are short-lived; private buckets are never exposed publicly. */
export const SIGNED_URL_TTL_SECONDS = 60 * 15;

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadToBucket(
  bucket: StorageBucket,
  file: File,
  userId: string,
): Promise<UploadResult> {
  const rule = BUCKET_RULES[bucket];
  if (file.type && !rule.mimeTypes.includes(file.type)) {
    return { ok: false, error: `Unsupported file type. Allowed: ${rule.label}.` };
  }
  if (file.size > rule.maxBytes) {
    return { ok: false, error: `File is too large. Allowed: ${rule.label}.` };
  }

  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}

export async function createSignedUrl(bucket: StorageBucket, path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

/** Resolves a short-lived signed URL for a stored object path. */
export function useSignedUrl(bucket: StorageBucket, path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    void createSignedUrl(bucket, path).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);
  return url;
}
