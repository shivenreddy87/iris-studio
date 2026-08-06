import { z } from "zod";

/** Shared option sets — plain data so forms and future filters agree. */
export const BUSINESS_CATEGORIES = [
  "Fashion & Apparel",
  "Beauty & Personal Care",
  "Food & Beverage",
  "Health & Fitness",
  "Technology",
  "Travel & Hospitality",
  "Finance",
  "Education",
  "Entertainment",
  "Other",
] as const;

export const INFLUENCER_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Food",
  "Fitness",
  "Tech",
  "Travel",
  "Gaming",
  "Lifestyle",
  "Comedy",
  "Education",
  "Other",
] as const;

export const PRIMARY_PLATFORMS = ["Instagram", "TikTok", "YouTube", "X", "Facebook"] as const;

export const FOLLOWER_RANGES = [
  "1K – 10K",
  "10K – 50K",
  "50K – 100K",
  "100K – 500K",
  "500K – 1M",
  "1M+",
] as const;

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(120),
  category: z.string().trim().min(1, "Pick a category"),
  contactPerson: z.string().trim().min(2, "Contact person is required").max(120),
  contactEmail: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  location: z.string().trim().min(2, "Location is required").max(120),
  website: optionalText,
  instagram: optionalText,
  description: z
    .string()
    .trim()
    .min(20, "Tell us at least a sentence or two")
    .max(1000, "Keep it under 1000 characters"),
  logoUrl: z.string().trim().max(500).optional(),
});

export const influencerProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(120),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dots, dashes and underscores only"),
    category: z.string().trim().min(1, "Pick a category"),
    location: z.string().trim().min(2, "Location is required").max(120),
    primaryPlatform: z.string().trim().min(1, "Pick your primary platform"),
    followerRange: z.string().trim().min(1, "Pick a follower range"),
    bio: z
      .string()
      .trim()
      .min(20, "Tell brands a little about you")
      .max(1000, "Keep it under 1000 characters"),
    instagramHandle: optionalText,
    tiktokHandle: optionalText,
    youtubeChannel: optionalText,
    avatarUrl: z.string().trim().max(500).optional(),
  })
  .refine((value) => Boolean(value.instagramHandle || value.tiktokHandle || value.youtubeChannel), {
    message: "Add at least one social handle or URL",
    path: ["instagramHandle"],
  });

export type BusinessProfileInput = z.input<typeof businessProfileSchema>;
export type InfluencerProfileInput = z.input<typeof influencerProfileSchema>;

export type BusinessProfile = z.output<typeof businessProfileSchema>;
export type InfluencerProfile = z.output<typeof influencerProfileSchema>;

export type MyProfile = {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: "brand" | "creator" | "admin" | null;
  onboardingCompletedAt: string | null;
  business: BusinessProfile | null;
  influencer: InfluencerProfile | null;
};

export type ProfileCompletion = {
  percent: number;
  completed: number;
  total: number;
  missing: string[];
};
