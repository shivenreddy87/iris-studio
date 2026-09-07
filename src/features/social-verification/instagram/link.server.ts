/**
 * Persisting an Instagram OAuth connection and resolving the Creoinfo user
 * (server-only). Access tokens never leave this layer unencrypted.
 */

import { encryptToken } from "./crypto.server";
import type { InstagramProfile, InstagramTokens } from "./api.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Synthetic address for Instagram-only sign-ups; Instagram exposes no email. */
export function instagramPlaceholderEmail(providerUserId: string): string {
  return `ig-${providerUserId}@instagram.creoinfo.app`;
}

/**
 * Stores the connection. OAuth is itself proof of ownership, so the account is
 * marked verified without an admin review round-trip.
 */
export async function saveInstagramConnection(input: {
  userId: string;
  profile: InstagramProfile;
  tokens: InstagramTokens;
}): Promise<void> {
  const db = await admin();
  const { profile, tokens, userId } = input;

  const { count } = await db
    .from("connected_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const existing = (
    await db
      .from("connected_accounts")
      .select("id, is_primary")
      .eq("user_id", userId)
      .eq("platform", "instagram")
      .maybeSingle()
  ).data as { id: string; is_primary: boolean } | null;

  const primary = existing?.is_primary || (count ?? 0) === 0 || true;
  if (primary) {
    await db
      .from("connected_accounts")
      .update({ is_primary: false } as never)
      .eq("user_id", userId)
      .eq("is_primary", true);
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: userId,
    platform: "instagram",
    handle: profile.username,
    profile_url: `https://www.instagram.com/${profile.username}/`,
    provider_user_id: profile.providerUserId,
    followers: profile.followers,
    media_count: profile.mediaCount,
    avatar_url: profile.avatarUrl,
    account_type: profile.accountType,
    access_token_encrypted: await encryptToken(tokens.accessToken),
    token_expires_at: tokens.expiresAt,
    connection_method: "instagram_oauth",
    status: "connected",
    connection_status: "connected",
    is_primary: primary,
    verification_status: "verified",
    verified_at: now,
    rejection_reason: null,
    verification_code: null,
    last_synced_at: now,
    updated_at: now,
  };

  const { error } = await db
    .from("connected_accounts")
    .upsert(payload as never, { onConflict: "user_id,platform" });
  if (error) throw new Error(error.message);

  // Contest eligibility reads the real follower count from the profile too.
  if (profile.followers && profile.followers > 0) {
    await db
      .from("creator_profiles")
      .update({ followers: profile.followers } as never)
      .eq("user_id", userId);
  }
}

/** Returns the decrypted token for a user's Instagram connection, if any. */
export async function getInstagramToken(userId: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("connected_accounts")
    .select("access_token_encrypted")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .maybeSingle();
  const stored = (data as { access_token_encrypted: string | null } | null)?.access_token_encrypted;
  if (!stored) return null;
  const { decryptToken } = await import("./crypto.server");
  return decryptToken(stored);
}

/** Existing owner of this Instagram identity, if the account was linked before. */
export async function findUserByInstagramId(providerUserId: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("connected_accounts")
    .select("user_id")
    .eq("platform", "instagram")
    .eq("provider_user_id", providerUserId)
    .maybeSingle();
  return (data as { user_id: string } | null)?.user_id ?? null;
}

/** Finds or creates the Creoinfo account behind an Instagram sign-in. */
export async function resolveUserForInstagramLogin(profile: InstagramProfile): Promise<string> {
  const linked = await findUserByInstagramId(profile.providerUserId);
  if (linked) return linked;

  const db = await admin();
  const email = instagramPlaceholderEmail(profile.providerUserId);
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: profile.username,
      instagram_username: profile.username,
      avatar_url: profile.avatarUrl,
      signup_provider: "instagram",
    },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create the account.");
  return data.user.id;
}

/**
 * One-time magic link used to hand the browser a real session after Instagram
 * OAuth. The link is consumed immediately by the callback landing page.
 */
export async function createSessionLink(userId: string, origin: string): Promise<string> {
  const db = await admin();
  const { data: userData } = await db.auth.admin.getUserById(userId);
  const email = userData.user?.email;
  if (!email) throw new Error("Account has no email address.");

  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/instagram` },
  });
  if (error || !data.properties) throw new Error(error?.message ?? "Could not start the session.");
  return data.properties.hashed_token;
}
