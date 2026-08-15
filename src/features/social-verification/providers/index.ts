import { instagramProvider } from "./instagram";
import { youtubeProvider } from "./youtube";
import type { SocialProvider, UrlValidation } from "./types";
import { SUPPORTED_PLATFORMS, type SocialPlatform } from "../types";

export * from "./types";
export { instagramProvider, youtubeProvider };

const REGISTRY: Partial<Record<SocialPlatform, SocialProvider>> = {
  instagram: instagramProvider,
  youtube: youtubeProvider,
};

export function getProvider(platform: string | null | undefined): SocialProvider | null {
  if (!platform) return null;
  return REGISTRY[platform.toLowerCase() as SocialPlatform] ?? null;
}

/** Platforms with a working provider today. Instagram first, YouTube next. */
export function listProviders(): SocialProvider[] {
  return SUPPORTED_PLATFORMS.map((p) => REGISTRY[p]).filter((p): p is SocialProvider => Boolean(p));
}

/** Contest-platform aware URL check. Unknown platforms fall back to a URL check. */
export function validateContentUrlFor(platform: string | null, url: string): UrlValidation {
  const provider = getProvider(platform);
  if (provider) return provider.validateContentUrl(url);
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, message: "Enter a valid URL starting with https://" };
    }
    return { ok: true, normalized: parsed.toString() };
  } catch {
    return { ok: false, message: "Enter a valid URL starting with https://" };
  }
}
