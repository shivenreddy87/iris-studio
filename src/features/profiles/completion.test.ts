import { describe, expect, it } from "vitest";
import {
  businessCompletion,
  influencerCompletion,
  profileCompletion,
} from "@/features/profiles/completion";
import type { BusinessProfile, InfluencerProfile, MyProfile } from "@/features/profiles/types";

const business: BusinessProfile = {
  businessName: "Acme",
  category: "Retail",
  contactPerson: "Ada",
  contactEmail: "ada@acme.test",
  phone: "+91 90000 00000",
  location: "Mumbai",
  website: undefined,
  instagram: undefined,
  description: "We sell things.",
  logoUrl: undefined,
};

const influencer: InfluencerProfile = {
  fullName: "Rio",
  username: "rio",
  category: "Fashion",
  location: "Delhi",
  primaryPlatform: "instagram",
  followerRange: "10k-50k",
  bio: "Style and thrift finds.",
  instagramHandle: "rio",
  tiktokHandle: undefined,
  youtubeChannel: undefined,
  avatarUrl: undefined,
};

describe("businessCompletion", () => {
  it("is 100% when every required field is filled", () => {
    const result = businessCompletion(business);
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("is 0% with no profile", () => {
    expect(businessCompletion(null).percent).toBe(0);
  });

  it("ignores optional website and instagram", () => {
    expect(businessCompletion({ ...business, website: undefined }).percent).toBe(100);
  });

  it("treats whitespace as missing and names the field", () => {
    const result = businessCompletion({ ...business, phone: "   " });
    expect(result.percent).toBeLessThan(100);
    expect(result.missing).toContain("Business phone");
  });
});

describe("influencerCompletion", () => {
  it("requires at least one social handle", () => {
    const result = influencerCompletion({
      ...influencer,
      instagramHandle: "",
      tiktokHandle: undefined,
      youtubeChannel: undefined,
    });
    expect(result.percent).toBeLessThan(100);
    expect(result.missing).toContain("At least one social handle");
  });

  it("accepts any single social handle", () => {
    expect(
      influencerCompletion({ ...influencer, instagramHandle: "", tiktokHandle: "rio" }).percent,
    ).toBe(100);
    expect(
      influencerCompletion({
        ...influencer,
        instagramHandle: "",
        youtubeChannel: "@rio",
      }).percent,
    ).toBe(100);
  });

  it("is 100% for a complete profile", () => {
    expect(influencerCompletion(influencer).percent).toBe(100);
  });
});

describe("profileCompletion", () => {
  const base = {
    userId: "u1",
    fullName: "Rio",
    email: "rio@test.dev",
    onboardingCompletedAt: null,
  };

  it("routes by role", () => {
    expect(
      profileCompletion({
        ...base,
        role: "brand",
        business,
        influencer: null,
      } as MyProfile).percent,
    ).toBe(100);
    expect(
      profileCompletion({
        ...base,
        role: "creator",
        business: null,
        influencer,
      } as MyProfile).percent,
    ).toBe(100);
  });

  it("treats admins as complete and missing profiles as empty", () => {
    expect(
      profileCompletion({
        ...base,
        role: "admin",
        business: null,
        influencer: null,
      } as MyProfile).percent,
    ).toBe(100);
    expect(profileCompletion(null).percent).toBe(0);
  });
});
