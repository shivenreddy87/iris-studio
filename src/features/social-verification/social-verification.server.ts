/**
 * Server-authoritative social-account gate.
 *
 * Contest application and submission paths call these helpers instead of
 * trusting any client-supplied "connected" flag.
 */

import { PLATFORM_LABELS, isSupportedPlatform, type SocialPlatform } from "./types";

export type SocialRequirementError = {
  ok: false;
  code: "missing_primary_account" | "account_not_verified" | "unsupported_platform";
  platform: string;
  message: string;
};

export type SocialRequirementResult =
  | { ok: true; accountId: string; handle: string; platform: SocialPlatform }
  | SocialRequirementError;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * The influencer must have a primary, connected account on the contest's
 * platform before they may take part. Returns a typed error, never throws.
 */
export async function requirePrimarySocialAccount(
  influencerId: string,
  platform: string | null | undefined,
): Promise<SocialRequirementResult> {
  const target = (platform ?? "").toLowerCase();
  if (!isSupportedPlatform(target)) {
    return {
      ok: false,
      code: "unsupported_platform",
      platform: target,
      message: "This contest has no supported social platform configured.",
    };
  }
  const label = PLATFORM_LABELS[target as SocialPlatform];

  const db = await admin();
  const { data, error } = await db
    .from("connected_accounts")
    .select("id, handle, platform, is_primary, connection_status, verification_status")
    .eq("user_id", influencerId)
    .eq("platform", target)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (!data || !data.is_primary || data.connection_status === "disconnected" || !data.handle) {
    return {
      ok: false,
      code: "missing_primary_account",
      platform: target,
      message: `Connect your ${label} account and set it as primary before taking part in ${label} contests.`,
    };
  }

  return {
    ok: true,
    accountId: data.id as string,
    handle: data.handle as string,
    platform: target as SocialPlatform,
  };
}

/** Platform the influencer is primary on, if any. */
export async function getPrimaryPlatform(influencerId: string): Promise<SocialPlatform | null> {
  const db = await admin();
  const { data } = await db
    .from("connected_accounts")
    .select("platform")
    .eq("user_id", influencerId)
    .eq("is_primary", true)
    .maybeSingle();
  return (data?.platform as SocialPlatform | undefined) ?? null;
}
