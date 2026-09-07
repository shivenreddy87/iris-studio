/**
 * Instagram Graph calls (server-only, strictly read-only).
 *
 * Only GET requests for profile and content metrics are made here. No
 * endpoint in this module modifies the user's Instagram account.
 */

import {
  IG_GRAPH,
  IG_GRAPH_VERSION,
  IG_TOKEN,
  readInstagramCredentials,
  instagramRedirectUri,
} from "./config.server";

export type InstagramTokens = {
  accessToken: string;
  /** Absolute expiry of the long-lived token. */
  expiresAt: string | null;
  providerUserId: string;
};

export type InstagramProfile = {
  providerUserId: string;
  username: string;
  accountType: string | null;
  followers: number | null;
  mediaCount: number | null;
  avatarUrl: string | null;
};

export type InstagramMediaMetrics = {
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  permalink: string | null;
};

async function readJson(response: Response, label: string): Promise<Record<string, unknown>> {
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !body) {
    const message =
      (body?.["error"] as { message?: string } | undefined)?.message ??
      (body?.["error_message"] as string | undefined) ??
      `Instagram ${label} failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

/** Authorization code -> short-lived token -> long-lived token. */
export async function exchangeCodeForTokens(code: string, origin: string): Promise<InstagramTokens> {
  const creds = readInstagramCredentials();
  if (!creds) throw new Error("Instagram is not configured yet.");

  const form = new URLSearchParams({
    client_id: creds.appId,
    client_secret: creds.appSecret,
    grant_type: "authorization_code",
    redirect_uri: instagramRedirectUri(origin),
    code,
  });
  const shortRes = await fetch(IG_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const short = await readJson(shortRes, "token exchange");
  const shortToken = String(short["access_token"] ?? "");
  const providerUserId = String(short["user_id"] ?? "");
  if (!shortToken || !providerUserId) throw new Error("Instagram did not return an access token.");

  const longUrl = new URL(`${IG_GRAPH}/access_token`);
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", creds.appSecret);
  longUrl.searchParams.set("access_token", shortToken);
  const long = await readJson(await fetch(longUrl), "long-lived token exchange");

  const accessToken = String(long["access_token"] ?? shortToken);
  const expiresIn = Number(long["expires_in"] ?? 0);
  return {
    accessToken,
    expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    providerUserId,
  };
}

/** Long-lived tokens last 60 days and can be refreshed while still valid. */
export async function refreshLongLivedToken(accessToken: string): Promise<InstagramTokens | null> {
  const url = new URL(`${IG_GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as Record<string, unknown>;
  const token = String(body["access_token"] ?? "");
  if (!token) return null;
  const expiresIn = Number(body["expires_in"] ?? 0);
  return {
    accessToken: token,
    expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    providerUserId: "",
  };
}

export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const url = new URL(`${IG_GRAPH}/${IG_GRAPH_VERSION}/me`);
  url.searchParams.set(
    "fields",
    "user_id,username,account_type,followers_count,media_count,profile_picture_url",
  );
  url.searchParams.set("access_token", accessToken);
  const body = await readJson(await fetch(url), "profile lookup");

  const followers = body["followers_count"];
  const media = body["media_count"];
  return {
    providerUserId: String(body["user_id"] ?? body["id"] ?? ""),
    username: String(body["username"] ?? ""),
    accountType: body["account_type"] ? String(body["account_type"]) : null,
    followers: typeof followers === "number" ? followers : null,
    mediaCount: typeof media === "number" ? media : null,
    avatarUrl: body["profile_picture_url"] ? String(body["profile_picture_url"]) : null,
  };
}

/** Finds the media id for a permalink the influencer submitted. */
export async function findMediaIdByPermalink(
  accessToken: string,
  permalink: string,
): Promise<string | null> {
  const target = permalink.replace(/\/+$/, "").toLowerCase();
  let next: string | null = `${IG_GRAPH}/${IG_GRAPH_VERSION}/me/media?fields=id,permalink&limit=50&access_token=${encodeURIComponent(accessToken)}`;
  for (let page = 0; page < 4 && next; page++) {
    const body: Record<string, unknown> = await readJson(await fetch(next), "media lookup");
    const items = (body["data"] as Array<{ id: string; permalink?: string }> | undefined) ?? [];
    const hit = items.find((item) => (item.permalink ?? "").replace(/\/+$/, "").toLowerCase() === target);
    if (hit) return hit.id;
    next = ((body["paging"] as { next?: string } | undefined)?.next as string | undefined) ?? null;
  }
  return null;
}

export async function fetchMediaMetrics(
  accessToken: string,
  mediaId: string,
): Promise<InstagramMediaMetrics> {
  const base = new URL(`${IG_GRAPH}/${IG_GRAPH_VERSION}/${mediaId}`);
  base.searchParams.set("fields", "permalink,like_count,comments_count");
  base.searchParams.set("access_token", accessToken);
  const media = await readJson(await fetch(base), "media fields");

  const insightsUrl = new URL(`${IG_GRAPH}/${IG_GRAPH_VERSION}/${mediaId}/insights`);
  insightsUrl.searchParams.set("metric", "views,reach,shares");
  insightsUrl.searchParams.set("access_token", accessToken);
  const insightsRes = await fetch(insightsUrl);
  const insights: Record<string, number> = {};
  if (insightsRes.ok) {
    const body = (await insightsRes.json()) as {
      data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
    };
    for (const entry of body.data ?? []) {
      const value = entry.values?.[0]?.value;
      if (typeof value === "number") insights[entry.name] = value;
    }
  }

  return {
    views: insights["views"] ?? null,
    reach: insights["reach"] ?? null,
    shares: insights["shares"] ?? null,
    likes: typeof media["like_count"] === "number" ? (media["like_count"] as number) : null,
    comments: typeof media["comments_count"] === "number" ? (media["comments_count"] as number) : null,
    permalink: media["permalink"] ? String(media["permalink"]) : null,
  };
}
