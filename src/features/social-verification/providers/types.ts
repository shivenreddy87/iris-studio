/**
 * Provider abstraction for social platforms.
 *
 * Nothing here talks to an official API yet. Each provider implements the same
 * interface so an official Instagram/Meta or YouTube integration can be dropped
 * in later without touching contest, submission, reward or payout logic.
 */

import type { SocialPlatform } from "../types";

export type MetricsSource = "manual" | "instagram_api" | "youtube_api";

export type MetricsStatus = "pending" | "verified";

export type ContentMetrics = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  reach: number | null;
  engagementRate: number | null;
  source: MetricsSource;
  status: MetricsStatus;
  syncedAt: string | null;
};

export type UrlValidation = { ok: true; normalized: string } | { ok: false; message: string };

export type AccountProfile = {
  platform: SocialPlatform;
  handle: string;
  profileUrl: string | null;
  providerUserId: string | null;
  followers: number | null;
};

export type ConnectResult = {
  handle: string;
  profileUrl: string | null;
  providerUserId: string | null;
  /** "manual" until an official authorization flow is configured. */
  method: "manual" | "oauth";
};

export interface SocialProvider {
  platform: SocialPlatform;
  label: string;
  /** Whether an official API integration is configured for this platform. */
  apiConfigured: boolean;
  /** What the influencer must submit for a contest on this platform. */
  contentLabel: string;
  contentPlaceholder: string;
  connectAccount(input: { handle: string; profileUrl?: string | null }): ConnectResult;
  disconnectAccount(): { ok: true };
  getAccountProfile(input: { handle: string; profileUrl?: string | null }): AccountProfile | null;
  /** Returns null while no official API access exists — never fabricated numbers. */
  getContentMetrics(contentUrl: string): Promise<ContentMetrics | null>;
  validateContentUrl(url: string): UrlValidation;
}

export function pendingMetrics(source: MetricsSource = "manual"): ContentMetrics {
  return {
    views: null,
    likes: null,
    comments: null,
    shares: null,
    reach: null,
    engagementRate: null,
    source,
    status: "pending",
    syncedAt: null,
  };
}
