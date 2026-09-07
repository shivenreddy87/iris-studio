/**
 * Instagram integration configuration (server-only).
 *
 * Uses the current "Instagram API with Instagram Login" product. The retired
 * Basic Display API is deliberately not used.
 *
 * Every value is read inside a function so nothing is captured at module
 * scope — env is injected per request on the worker runtime.
 */

export const IG_GRAPH = "https://graph.instagram.com";
export const IG_GRAPH_VERSION = "v23.0";
export const IG_AUTHORIZE = "https://www.instagram.com/oauth/authorize";
export const IG_TOKEN = "https://api.instagram.com/oauth/access_token";

/**
 * Read-only scopes only. Creoinfo never posts, follows, likes, comments or
 * messages on a user's behalf — see the social safety contract in
 * `../providers/types.ts`.
 */
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"];

export type InstagramCredentials = { appId: string; appSecret: string };

export function readInstagramCredentials(): InstagramCredentials | null {
  const appId = process.env["INSTAGRAM_APP_ID"];
  const appSecret = process.env["INSTAGRAM_APP_SECRET"];
  if (!appId?.trim() || !appSecret?.trim()) return null;
  return { appId: appId.trim(), appSecret: appSecret.trim() };
}

export function isInstagramConfigured(): boolean {
  return readInstagramCredentials() !== null;
}

/** The single redirect address that must be registered in the Meta app. */
export function instagramRedirectUri(origin: string): string {
  return `${origin}/api/public/instagram/callback`;
}
