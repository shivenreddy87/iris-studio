/**
 * Social account verification data layer (server-only).
 *
 * Verification is proof-of-ownership based: the influencer places a one-time
 * code in their public bio, an admin checks it and approves. The database
 * trigger `guard_connected_account_verification` prevents anyone but an admin
 * (or trusted server code) from writing the verified state.
 */

import {
  PLATFORM_LABELS,
  type PendingVerification,
  type SocialAccount,
  type SocialPlatform,
  type VerificationStatus,
} from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Row = {
  id: string;
  user_id: string;
  platform: string;
  handle: string | null;
  profile_url: string | null;
  provider_user_id: string | null;
  followers: number | null;
  verification_status: string;
  connection_status: string;
  is_primary: boolean;
  verification_code: string | null;
  verification_requested_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, user_id, platform, handle, profile_url, provider_user_id, followers, verification_status, connection_status, is_primary, verification_code, verification_requested_at, verified_at, rejection_reason, created_at, updated_at";

function mapRow(row: Row): SocialAccount {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform as SocialPlatform,
    handle: row.handle ?? "",
    profileUrl: row.profile_url,
    providerUserId: row.provider_user_id ?? null,
    followers: row.followers,
    status: row.verification_status as VerificationStatus,
    connectionStatus: (row.connection_status === "disconnected"
      ? "disconnected"
      : "connected") as SocialAccount["connectionStatus"],
    isPrimary: Boolean(row.is_primary),
    connectedAt: row.created_at ?? null,
    verificationCode: row.verification_code,
    requestedAt: row.verification_requested_at,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    updatedAt: row.updated_at,
  };
}


/** Short, human-readable, unambiguous proof code. */
export function makeVerificationCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `EROS-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

export async function listAccountsForUser(userId: string): Promise<SocialAccount[]> {
  const db = await admin();
  const { data, error } = await db
    .from("connected_accounts")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("platform");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function saveAccount(input: {
  userId: string;
  platform: SocialPlatform;
  handle: string;
  profileUrl?: string;
  followers?: number;
  makePrimary?: boolean;
}): Promise<SocialAccount> {
  const db = await admin();
  const { getProvider } = await import("./providers");
  const provider = getProvider(input.platform);
  const connection = provider
    ? provider.connectAccount({ handle: input.handle, profileUrl: input.profileUrl ?? null })
    : { handle: input.handle, profileUrl: input.profileUrl ?? null, providerUserId: null };

  const existing = (
    await db
      .from("connected_accounts")
      .select(COLUMNS)
      .eq("user_id", input.userId)
      .eq("platform", input.platform)
      .maybeSingle()
  ).data as Row | null;

  // Editing an approved handle invalidates the approval.
  const changed =
    !existing ||
    existing.handle !== connection.handle ||
    (existing.profile_url ?? null) !== (connection.profileUrl ?? null);

  // First account for the influencer becomes primary automatically.
  const { count } = await db
    .from("connected_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId);
  const primary = input.makePrimary ?? (existing?.is_primary || (count ?? 0) === 0);
  if (primary) await clearPrimary(input.userId);

  const payload = {
    user_id: input.userId,
    platform: input.platform,
    handle: connection.handle,
    profile_url: connection.profileUrl,
    provider_user_id: connection.providerUserId,
    followers: input.followers ?? null,
    status: "connected",
    connection_status: "connected",
    is_primary: primary,
    verification_status: changed ? "unverified" : existing.verification_status,
    verification_code: changed ? makeVerificationCode() : existing.verification_code,
    verification_requested_at: changed ? null : existing.verification_requested_at,
    verified_at: changed ? null : existing.verified_at,
    verified_by: changed ? null : undefined,
    rejection_reason: changed ? null : existing.rejection_reason,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("connected_accounts")
    .upsert(payload as never, { onConflict: "user_id,platform" })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

async function clearPrimary(userId: string): Promise<void> {
  const db = await admin();
  await db
    .from("connected_accounts")
    .update({ is_primary: false } as never)
    .eq("user_id", userId)
    .eq("is_primary", true);
}

/** Exactly one primary account per influencer. */
export async function setPrimaryAccount(userId: string, accountId: string): Promise<SocialAccount> {
  const db = await admin();
  const existing = (
    await db
      .from("connected_accounts")
      .select(COLUMNS)
      .eq("id", accountId)
      .eq("user_id", userId)
      .maybeSingle()
  ).data as Row | null;
  if (!existing) throw new Error("Social account not found.");
  await clearPrimary(userId);
  const { data, error } = await db
    .from("connected_accounts")
    .update({ is_primary: true, connection_status: "connected" } as never)
    .eq("id", accountId)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}


export async function removeAccount(userId: string, accountId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("connected_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function requestVerification(
  userId: string,
  accountId: string,
): Promise<SocialAccount> {
  const db = await admin();
  const existing = (
    await db
      .from("connected_accounts")
      .select(COLUMNS)
      .eq("id", accountId)
      .eq("user_id", userId)
      .maybeSingle()
  ).data as Row | null;

  if (!existing) throw new Error("Social account not found.");
  if (existing.verification_status === "verified")
    throw new Error("This account is already verified.");
  if (existing.verification_status === "pending")
    throw new Error("This account is already awaiting review.");
  if (!existing.handle?.trim()) throw new Error("Add your handle before requesting verification.");

  const { data, error } = await db
    .from("connected_accounts")
    .update({
      verification_status: "pending",
      verification_requested_at: new Date().toISOString(),
      verification_code: existing.verification_code ?? makeVerificationCode(),
      rejection_reason: null,
    } as never)
    .eq("id", accountId)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

export async function listPendingVerifications(
  status: VerificationStatus | "all" = "pending",
): Promise<PendingVerification[]> {
  const db = await admin();
  let query = db.from("connected_accounts").select(COLUMNS).order("verification_requested_at", {
    ascending: true,
    nullsFirst: false,
  });
  if (status !== "all") query = query.eq("verification_status", status);

  const { data, error } = await query.limit(300);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await db.from("profiles").select("id, full_name, email").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...mapRow(row),
    ownerName: byId.get(row.user_id)?.full_name ?? null,
    ownerEmail: byId.get(row.user_id)?.email ?? null,
  }));
}

export async function reviewVerification(input: {
  accountId: string;
  adminId: string;
  decision: "approve" | "reject";
  reason?: string;
}): Promise<SocialAccount> {
  const db = await admin();
  const existing = (
    await db.from("connected_accounts").select(COLUMNS).eq("id", input.accountId).maybeSingle()
  ).data as Row | null;
  if (!existing) throw new Error("Social account not found.");
  if (existing.verification_status !== "pending")
    throw new Error("Only accounts awaiting review can be decided on.");

  const approved = input.decision === "approve";
  if (!approved && !input.reason?.trim())
    throw new Error("Give the influencer a reason for the rejection.");

  const { data, error } = await db
    .from("connected_accounts")
    .update({
      verification_status: approved ? "verified" : "rejected",
      verified_at: approved ? new Date().toISOString() : null,
      verified_by: approved ? input.adminId : null,
      rejection_reason: approved ? null : (input.reason?.trim() ?? null),
      last_synced_at: new Date().toISOString(),
    } as never)
    .eq("id", input.accountId)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  const account = mapRow(data as Row);
  const label = PLATFORM_LABELS[account.platform] ?? account.platform;

  const { createNotification } = await import("@/features/activity/notification.server");
  await createNotification({
    userId: account.userId,
    title: approved ? `${label} account verified` : `${label} verification rejected`,
    body: approved
      ? `Your ${label} account @${account.handle} is now verified.`
      : (input.reason?.trim() ?? `We could not verify @${account.handle}.`),
    link: "/app/profile",
    actionLabel: "View profile",
    category: "system",
    priority: approved ? "normal" : "high",
  });

  return account;
}
