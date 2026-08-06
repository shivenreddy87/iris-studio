import { describe, expect, it } from "vitest";
import {
  evaluateAvailability,
  evaluateEligibility,
  isDiscoverable,
  type InfluencerEligibilityProfile,
} from "@/features/contests/eligibility";
import type { Contest } from "@/features/contests/types";

const NOW = new Date("2026-03-15T12:00:00.000Z");

function contest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: "c1",
    campaignRequestId: "r1",
    approvalReference: "APR-000001",
    businessId: "b1",
    businessName: "Acme",
    title: "Spring launch",
    description: null,
    campaignGoal: null,
    businessCategory: null,
    targetPlatform: "instagram",
    targetLocation: null,
    requiredViews: null,
    rewardPool: 1000,
    participantLimit: 10,
    winnerCount: 3,
    preferredCreatorCategory: null,
    minimumFollowers: null,
    maximumFollowers: null,
    applicationStartDate: "2026-03-01",
    applicationDeadline: "2026-03-31",
    contestStartDate: null,
    contestEndDate: null,
    contestBrief: null,
    contestRules: null,
    attachmentUrl: null,
    status: "applications_open",
    publishedAt: "2026-03-01T00:00:00.000Z",
    archivedAt: null,
    createdBy: "admin",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

function profile(overrides: Partial<InfluencerEligibilityProfile> = {}) {
  return { category: "Fashion", followers: 25_000, location: "Mumbai, India", ...overrides };
}

describe("evaluateAvailability", () => {
  it("is open inside the window", () => {
    const result = evaluateAvailability(contest(), NOW);
    expect(result.state).toBe("open");
    expect(result.isOpen).toBe(true);
  });

  it("closes after the deadline day ends", () => {
    expect(evaluateAvailability(contest(), new Date("2026-04-01T00:00:01Z")).state).toBe("closed");
  });

  it("is not yet open before the start date", () => {
    expect(evaluateAvailability(contest(), new Date("2026-02-10T00:00:00Z")).state).toBe(
      "not_yet_open",
    );
  });

  it("reports archived contests", () => {
    expect(evaluateAvailability(contest({ status: "archived" }), NOW).state).toBe("archived");
  });

  it("reports drafts as not published", () => {
    expect(evaluateAvailability(contest({ status: "draft" }), NOW).state).toBe("not_published");
  });
});

describe("isDiscoverable", () => {
  it("hides drafts, archived and unpublished contests", () => {
    expect(isDiscoverable(contest({ status: "draft" }), NOW)).toBe(false);
    expect(isDiscoverable(contest({ archivedAt: "2026-03-02" }), NOW)).toBe(false);
    expect(isDiscoverable(contest({ publishedAt: null }), NOW)).toBe(false);
  });

  it("hides contests published in the future", () => {
    expect(isDiscoverable(contest({ publishedAt: "2026-12-01T00:00:00Z" }), NOW)).toBe(false);
  });

  it("shows live contests", () => {
    expect(isDiscoverable(contest(), NOW)).toBe(true);
  });
});

describe("evaluateEligibility", () => {
  it("passes a matching influencer", () => {
    const result = evaluateEligibility(contest(), profile(), NOW);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual(["eligible"]);
    expect(result.missingRequirements).toEqual([]);
  });

  it("rejects a category mismatch", () => {
    const result = evaluateEligibility(
      contest({ preferredCreatorCategory: "Gaming" }),
      profile(),
      NOW,
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("category_mismatch");
    expect(result.missingRequirements[0]).toContain("Gaming");
  });

  it("compares categories case- and whitespace-insensitively", () => {
    const result = evaluateEligibility(
      contest({ preferredCreatorCategory: "  fashion " }),
      profile({ category: "FASHION" }),
      NOW,
    );
    expect(result.eligible).toBe(true);
  });

  it("enforces follower bounds", () => {
    expect(
      evaluateEligibility(contest({ minimumFollowers: 50_000 }), profile(), NOW).reasons,
    ).toContain("followers_below_minimum");
    expect(
      evaluateEligibility(contest({ maximumFollowers: 10_000 }), profile(), NOW).reasons,
    ).toContain("followers_above_maximum");
  });

  it("treats a missing follower count as zero against a minimum", () => {
    const result = evaluateEligibility(
      contest({ minimumFollowers: 1000 }),
      profile({ followers: null }),
      NOW,
    );
    expect(result.reasons).toContain("followers_below_minimum");
  });

  it("matches locations by substring", () => {
    expect(evaluateEligibility(contest({ targetLocation: "India" }), profile(), NOW).eligible).toBe(
      true,
    );
    expect(
      evaluateEligibility(contest({ targetLocation: "Berlin" }), profile(), NOW).reasons,
    ).toContain("location_restricted");
  });

  it("blocks applications once the window has closed", () => {
    const result = evaluateEligibility(contest(), profile(), new Date("2026-05-01T00:00:00Z"));
    expect(result.reasons).toContain("applications_closed");
  });

  it("collects every failure at once", () => {
    const result = evaluateEligibility(
      contest({ preferredCreatorCategory: "Gaming", minimumFollowers: 100_000 }),
      profile(),
      NOW,
    );
    expect(result.reasons).toEqual(
      expect.arrayContaining(["category_mismatch", "followers_below_minimum"]),
    );
    expect(result.missingRequirements).toHaveLength(2);
  });
});
