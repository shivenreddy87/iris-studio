import type {
  BusinessProfile,
  InfluencerProfile,
  MyProfile,
  ProfileCompletion,
} from "./types";

/**
 * Completion is a pure calculation so the dashboard, the profile page and the
 * onboarding form all report the same number without a round trip.
 */

const BUSINESS_FIELDS: Array<{ key: keyof BusinessProfile; label: string }> = [
  { key: "businessName", label: "Business name" },
  { key: "category", label: "Business category" },
  { key: "contactPerson", label: "Contact person" },
  { key: "contactEmail", label: "Business email" },
  { key: "phone", label: "Business phone" },
  { key: "location", label: "Business location" },
  { key: "description", label: "Business description" },
];

const INFLUENCER_FIELDS: Array<{ key: keyof InfluencerProfile; label: string }> = [
  { key: "fullName", label: "Full name" },
  { key: "username", label: "Username" },
  { key: "category", label: "Primary category" },
  { key: "location", label: "Location" },
  { key: "primaryPlatform", label: "Primary platform" },
  { key: "followerRange", label: "Follower range" },
  { key: "bio", label: "Bio" },
];


function score(
  record: Record<string, unknown> | null,
  fields: Array<{ key: string; label: string }>,
): ProfileCompletion {
  const missing = fields
    .filter(({ key }) => {
      const value = record?.[key];
      return typeof value !== "string" || value.trim().length === 0;
    })
    .map(({ label }) => label);

  const total = fields.length;
  const completed = total - missing.length;
  return {
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
    completed,
    total,
    missing,
  };
}

export function businessCompletion(profile: BusinessProfile | null): ProfileCompletion {
  return score(profile as Record<string, unknown> | null, BUSINESS_FIELDS);
}

export function influencerCompletion(profile: InfluencerProfile | null): ProfileCompletion {
  return score(profile as Record<string, unknown> | null, INFLUENCER_FIELDS);
}

export function profileCompletion(profile: MyProfile | null | undefined): ProfileCompletion {
  if (!profile) return { percent: 0, completed: 0, total: 0, missing: [] };
  if (profile.role === "brand") return businessCompletion(profile.business);
  if (profile.role === "creator") return influencerCompletion(profile.influencer);
  return { percent: 100, completed: 0, total: 0, missing: [] };
}
