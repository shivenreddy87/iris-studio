import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "facebook",
  "linkedin",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X (Twitter)",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  unverified: "Not verified",
  pending: "Awaiting review",
  verified: "Verified",
  rejected: "Rejected",
};

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  handle: string;
  profileUrl: string | null;
  followers: number | null;
  status: VerificationStatus;
  verificationCode: string | null;
  requestedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  updatedAt: string;
}

export interface PendingVerification extends SocialAccount {
  ownerName: string | null;
  ownerEmail: string | null;
}

export const saveAccountSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: z
    .string()
    .trim()
    .min(2, "Enter your handle")
    .max(60)
    .transform((v) => v.replace(/^@/, "")),
  profileUrl: z
    .string()
    .trim()
    .url("Enter a valid profile URL")
    .max(300)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  followers: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
});

export type SaveAccountInput = z.infer<typeof saveAccountSchema>;

export const reviewSchema = z.object({
  accountId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});
