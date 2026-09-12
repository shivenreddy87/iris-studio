import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";

export type InstagramStatus = {
  configured: boolean;
  connected: boolean;
  username: string | null;
  accountType: string | null;
  followers: number | null;
  mediaCount: number | null;
  avatarUrl: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  tokenExpiresAt: string | null;
};

function originFromRequest(): string {
  const request = getRequest();
  return new URL(request.url).origin;
}

/** Whether Instagram is set up, plus the signed-in user's connection, if any. */
export const getInstagramStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InstagramStatus> => {
    const { isInstagramConfigured } = await import("./config.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("connected_accounts")
      .select(
        "handle, account_type, followers, media_count, avatar_url, created_at, last_synced_at, token_expires_at, connection_method, access_token_encrypted",
      )
      .eq("user_id", context.userId)
      .eq("platform", "instagram")
      .maybeSingle();

    const row = data as {
      handle: string | null;
      account_type: string | null;
      followers: number | null;
      media_count: number | null;
      avatar_url: string | null;
      created_at: string | null;
      last_synced_at: string | null;
      token_expires_at: string | null;
      connection_method: string | null;
      access_token_encrypted: string | null;
    } | null;

    const connected = Boolean(row?.access_token_encrypted);
    return {
      configured: isInstagramConfigured(),
      connected,
      username: connected ? (row?.handle ?? null) : null,
      accountType: connected ? (row?.account_type ?? null) : null,
      followers: connected ? (row?.followers ?? null) : null,
      mediaCount: connected ? (row?.media_count ?? null) : null,
      avatarUrl: connected ? (row?.avatar_url ?? null) : null,
      connectedAt: connected ? (row?.created_at ?? null) : null,
      lastSyncedAt: connected ? (row?.last_synced_at ?? null) : null,
      tokenExpiresAt: connected ? (row?.token_expires_at ?? null) : null,
    };
  });

/** Returns the Instagram authorization URL for linking the signed-in account. */
export const startInstagramLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string }> => {
    await assertNotSuspended(context.userId);
    const { readInstagramCredentials, instagramRedirectUri, IG_AUTHORIZE, IG_SCOPES } = await import(
      "./config.server"
    );
    const creds = readInstagramCredentials();
    if (!creds) throw new Error("Instagram connection isn't set up yet.");

    const origin = originFromRequest();
    const { signState } = await import("./crypto.server");
    const state = await signState({
      mode: "connect",
      userId: context.userId,
      origin,
      issuedAt: Date.now(),
    });

    const url = new URL(IG_AUTHORIZE);
    url.searchParams.set("client_id", creds.appId);
    url.searchParams.set("redirect_uri", instagramRedirectUri(origin));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", IG_SCOPES.join(","));
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

/** Pulls the latest username, picture, follower and media counts from Instagram. */
export const refreshInstagramData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InstagramStatus> => {
    const { getInstagramToken, saveInstagramConnection } = await import("./link.server");
    const token = await getInstagramToken(context.userId);
    if (!token) throw new Error("Connect your Instagram account first.");

    const { fetchInstagramProfile } = await import("./api.server");
    const { refreshLongLivedToken } = await import("./api.server");
    const profile = await fetchInstagramProfile(token);
    const refreshed = await refreshLongLivedToken(token);

    await saveInstagramConnection({
      userId: context.userId,
      profile,
      tokens: {
        accessToken: refreshed?.accessToken ?? token,
        expiresAt: refreshed?.expiresAt ?? null,
        providerUserId: profile.providerUserId,
      },
    });
    return getInstagramStatus();
  });

/** Clears the stored Instagram connection and its access token. */
export const disconnectInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({}).passthrough().parse(data ?? {}))
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("connected_accounts")
      .update({
        access_token_encrypted: null,
        token_expires_at: null,
        connection_status: "disconnected",
        connection_method: "manual",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", context.userId)
      .eq("platform", "instagram");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
