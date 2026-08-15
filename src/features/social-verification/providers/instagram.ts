import type { AccountProfile, ConnectResult, SocialProvider, UrlValidation } from "./types";

const HOSTS = ["instagram.com", "www.instagram.com", "instagr.am"];
const CONTENT_PATHS = ["/reel/", "/reels/", "/p/", "/tv/"];

/**
 * Instagram provider. Phase 1 uses influencer-supplied public Reel URLs and
 * admin verification; official Graph API metrics slot in behind the same
 * interface once app review and permissions are granted.
 */
export const instagramProvider: SocialProvider = {
  platform: "instagram",
  label: "Instagram",
  apiConfigured: false,
  contentLabel: "Instagram Reel URL",
  contentPlaceholder: "https://www.instagram.com/reel/abc123/",

  connectAccount({ handle, profileUrl }): ConnectResult {
    const clean = handle.trim().replace(/^@/, "");
    return {
      handle: clean,
      profileUrl: profileUrl?.trim() || `https://www.instagram.com/${clean}/`,
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
      platform: "instagram",
      handle: clean,
      profileUrl: profileUrl?.trim() || `https://www.instagram.com/${clean}/`,
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
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, message: "Enter a valid URL starting with https://" };
    }
    if (!HOSTS.includes(parsed.hostname.toLowerCase())) {
      return { ok: false, message: "This contest requires a public Instagram Reel URL." };
    }
    const path = parsed.pathname.toLowerCase();
    if (!CONTENT_PATHS.some((prefix) => path.startsWith(prefix))) {
      return {
        ok: false,
        message: "Link directly to the published Reel (instagram.com/reel/...).",
      };
    }
    return { ok: true, normalized: `${parsed.origin}${parsed.pathname}` };
  },
};
