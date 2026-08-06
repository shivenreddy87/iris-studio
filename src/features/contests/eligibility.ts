import type { Contest } from "./types";

/**
 * Pure eligibility + availability engine. Evaluated server-side for discovery
 * and reused by the Contest Applications validation layer.
 */

export const ELIGIBILITY_REASONS = [
  "eligible",
  "category_mismatch",
  "followers_below_minimum",
  "followers_above_maximum",
  "location_restricted",
  "contest_not_published",
  "applications_closed",
  "contest_archived",
] as const;

export type EligibilityReason = (typeof ELIGIBILITY_REASONS)[number];

export const ELIGIBILITY_REASON_LABELS: Record<EligibilityReason, string> = {
  eligible: "Eligible",
  category_mismatch: "Category Mismatch",
  followers_below_minimum: "Followers Below Minimum",
  followers_above_maximum: "Followers Above Maximum",
  location_restricted: "Location Restricted",
  contest_not_published: "Contest Not Published",
  applications_closed: "Applications Closed",
  contest_archived: "Contest Archived",
};

export const ELIGIBILITY_REASON_DETAILS: Record<EligibilityReason, string> = {
  eligible: "Your profile meets every requirement for this contest.",
  category_mismatch: "Your creator category does not match the category this contest asks for.",
  followers_below_minimum: "Your follower count is below the minimum this contest requires.",
  followers_above_maximum: "Your follower count is above the maximum this contest allows.",
  location_restricted: "This contest is limited to creators in a different location.",
  contest_not_published: "This contest is not open to influencers yet.",
  applications_closed: "The application window for this contest has closed.",
  contest_archived: "This contest has been archived.",
};

export const CONTEST_AVAILABILITY_STATES = [
  "not_published",
  "not_yet_open",
  "open",
  "closed",
  "archived",
] as const;

export type ContestAvailabilityState = (typeof CONTEST_AVAILABILITY_STATES)[number];

export const CONTEST_AVAILABILITY_LABELS: Record<ContestAvailabilityState, string> = {
  not_published: "Applications Not Yet Open",
  not_yet_open: "Applications Not Yet Open",
  open: "Applications Open",
  closed: "Applications Closed",
  archived: "Contest Archived",
};

export type ContestAvailability = {
  state: ContestAvailabilityState;
  label: string;
  isOpen: boolean;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: EligibilityReason[];
  missingRequirements: string[];
};

/** The influencer facts the engine needs. Nulls mean "not provided yet". */
export type InfluencerEligibilityProfile = {
  category: string | null;
  followers: number | null;
  location: string | null;
};

const startOfDay = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
const endOfDay = (value: string) => new Date(`${value.slice(0, 10)}T23:59:59.999`).getTime();

const normalise = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const nf = new Intl.NumberFormat();

/**
 * Where the contest sits in its application window. Published contests outside
 * the window stay visible but are not accepting applications.
 */
export function evaluateAvailability(contest: Contest, now: Date = new Date()): ContestAvailability {
  const at = now.getTime();
  const base = {
    applicationStartDate: contest.applicationStartDate,
    applicationDeadline: contest.applicationDeadline,
  };
  const build = (state: ContestAvailabilityState): ContestAvailability => ({
    state,
    label: CONTEST_AVAILABILITY_LABELS[state],
    isOpen: state === "open",
    ...base,
  });

  if (contest.status === "archived" || contest.archivedAt) return build("archived");
  if (contest.status !== "published" && contest.status !== "applications_open") {
    return build("not_published");
  }
  if (contest.applicationDeadline && at > endOfDay(contest.applicationDeadline)) {
    return build("closed");
  }
  if (contest.applicationStartDate && at < startOfDay(contest.applicationStartDate)) {
    return build("not_yet_open");
  }
  if (contest.status !== "applications_open") return build("not_yet_open");
  return build("open");
}

/** True when influencers may see the contest at all. */
export function isDiscoverable(contest: Contest, now: Date = new Date()): boolean {
  if (contest.archivedAt) return false;
  if (contest.status !== "published" && contest.status !== "applications_open") return false;
  if (!contest.publishedAt) return false;
  return new Date(contest.publishedAt).getTime() <= now.getTime();
}

/**
 * Structured eligibility: never a bare boolean, so every surface can explain
 * exactly what the influencer is missing.
 */
export function evaluateEligibility(
  contest: Contest,
  profile: InfluencerEligibilityProfile,
  now: Date = new Date(),
): EligibilityResult {
  const reasons: EligibilityReason[] = [];
  const missingRequirements: string[] = [];
  const availability = evaluateAvailability(contest, now);

  if (availability.state === "archived") {
    reasons.push("contest_archived");
  } else if (!isDiscoverable(contest, now)) {
    reasons.push("contest_not_published");
  } else if (availability.state === "closed") {
    reasons.push("applications_closed");
  } else if (availability.state !== "open") {
    // Not yet open is a timing state, not an eligibility failure.
  }

  const required = normalise(contest.preferredCreatorCategory);
  if (required && normalise(profile.category) !== required) {
    reasons.push("category_mismatch");
    missingRequirements.push(`Creator category must be ${contest.preferredCreatorCategory}`);
  }

  const followers = profile.followers;
  if (contest.minimumFollowers !== null && (followers ?? 0) < contest.minimumFollowers) {
    reasons.push("followers_below_minimum");
    missingRequirements.push(`At least ${nf.format(contest.minimumFollowers)} followers`);
  }
  if (
    contest.maximumFollowers !== null &&
    followers !== null &&
    followers > contest.maximumFollowers
  ) {
    reasons.push("followers_above_maximum");
    missingRequirements.push(`No more than ${nf.format(contest.maximumFollowers)} followers`);
  }

  const location = normalise(contest.targetLocation);
  if (location && !normalise(profile.location).includes(location)) {
    reasons.push("location_restricted");
    missingRequirements.push(`Located in ${contest.targetLocation}`);
  }

  const eligible = reasons.length === 0;
  return {
    eligible,
    reasons: eligible ? ["eligible"] : reasons,
    missingRequirements,
  };
}
