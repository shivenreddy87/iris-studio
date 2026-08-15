import type { AccountProfile, ConnectResult, SocialProvider, UrlValidation } from "./types";

const HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

/**
 * YouTube provider. Architecture-ready for the next integration: the interface
 * matches Instagram exactly, so enabling the official Data API later is a
 * provider-level change only.
 */
export const youtubeProvider: SocialProvider = {
  platform: "youtube",
  label: "YouTube",
  apiConfigured: false,
  contentLabel: "YouTube video URL",
  contentPlaceholder: "https://www.youtube.com/watch?v=abc123",

  connectAccount({ handle, profileUrl }): ConnectResult {
    const clean = handle.trim().replace(/^@/, "");
    return {
      handle: clean,
      profileUrl: profileUrl?.trim() || `https://www.youtube.com/@${clean}`,
      providerUserId: null,
      method: "manual",
    };
  },

  disconnectAccount() {
    return { ok: true };
  },

  getAccountProfile({ handle, profileUrl }): AccountProfile | null {
    const clean = handle.trim().replace(/^@/, "");
    if (!clean) return null;
    return {
      platform: "youtube",
      handle: clean,
      profileUrl: profileUrl?.trim() || `https://www.youtube.com/@${clean}`,
      providerUserId: null,
      followers: null,
    };
  },

  async getContentMetrics() {
    // No official API access configured — metrics stay pending platform verification.
    return null;
  },

  validateContentUrl(url: string): UrlValidation {
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      return { ok: false, message: "Enter a valid URL starting with https://" };
    }
    const host = parsed.hostname.toLowerCase();
    if (!HOSTS.includes(host)) {
      return { ok: false, message: "This contest requires a public YouTube video URL." };
    }
    const path = parsed.pathname.toLowerCase();
    const isWatch = path === "/watch" && parsed.searchParams.has("v");
    const isShort = path.startsWith("/shorts/") || path.startsWith("/live/");
    const isShortLink = host === "youtu.be" && path.length > 1;
    if (!isWatch && !isShort && !isShortLink) {
      return { ok: false, message: "Link directly to the published video." };
    }
    return { ok: true, normalized: parsed.toString() };
  },
};
