import { CONTEST_COLUMNS, decorate, isAdmin, type ContestRow, type Db } from "./contest.server";
import {
  evaluateAvailability,
  evaluateEligibility,
  isDiscoverable,
  type InfluencerEligibilityProfile,
} from "./eligibility";
import { resolveFollowerCount } from "./follower-count";
import type { Contest, ContestDiscoveryFilters, DiscoveryContest, DiscoveryPage } from "./types";

const DEFAULT_PAGE_SIZE = 12;
/** Discovery works on the published pool, which stays small; filter in memory. */
const MAX_ROWS = 500;

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

export async function loadInfluencerProfile(
  db: Db,
  userId: string,
): Promise<InfluencerEligibilityProfile> {
  const { data } = await db
    .from("creator_profiles")
    .select("niche, followers, follower_range, location")
    .eq("user_id", userId)
    .maybeSingle<{
      niche: string | null;
      followers: number | null;
      follower_range: string | null;
      location: string | null;
    }>();

  // A linked social account is the most trustworthy follower source.
  const { data: account } = await db
    .from("connected_accounts")
    .select("followers")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle<{ followers: number | null }>();

  return {
    category: data?.niche ?? null,
    followers: resolveFollowerCount({
      connectedFollowers: account?.followers ?? null,
      profileFollowers: data?.followers ?? null,
      followerRange: data?.follower_range ?? null,
    }),
    location: data?.location ?? null,
  };
}

export async function loadSavedIds(db: Db, userId: string): Promise<Set<string>> {
  const { data } = await db.from("saved_contests").select("contest_id").eq("influencer_id", userId);
  return new Set((data ?? []).map((r) => r.contest_id));
}

/** Every contest an influencer may see, newest publish first. */
export async function fetchDiscoverableContests(db: Db): Promise<Contest[]> {
  const { data, error } = await db
    .from("contests")
    .select(CONTEST_COLUMNS)
    .in("status", ["published", "applications_open"])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(MAX_ROWS)
    .returns<ContestRow[]>();
  if (error) throw new Error(error.message);
  const contests = await decorate(db, data ?? []);
  return contests.filter((c) => isDiscoverable(c));
}

function matches(contest: Contest, f: ContestDiscoveryFilters): boolean {
  const q = norm(f.search);
  if (q) {
    const haystack = [contest.title, contest.campaignGoal, contest.businessCategory]
      .map(norm)
      .join(" ");
    if (!haystack.includes(q)) return false;
  }
  if (f.platform && norm(contest.targetPlatform) !== norm(f.platform)) return false;
  if (f.creatorCategory && norm(contest.preferredCreatorCategory) !== norm(f.creatorCategory)) {
    return false;
  }
  if (f.location && !norm(contest.targetLocation).includes(norm(f.location))) return false;
  if (f.status && f.status !== "all" && contest.status !== f.status) return false;

  const reward = contest.rewardPool;
  if (f.minReward != null && (reward ?? 0) < f.minReward) return false;
  if (f.maxReward != null && (reward ?? 0) > f.maxReward) return false;

  // Follower filter keeps contests whose accepted range overlaps the requested range.
  if (f.minFollowers != null && contest.maximumFollowers !== null) {
    if (contest.maximumFollowers < f.minFollowers) return false;
  }
  if (f.maxFollowers != null && contest.minimumFollowers !== null) {
    if (contest.minimumFollowers > f.maxFollowers) return false;
  }

  if (f.deadlineBefore) {
    if (!contest.applicationDeadline) return false;
    if (contest.applicationDeadline.slice(0, 10) > f.deadlineBefore.slice(0, 10)) return false;
  }
  return true;
}

const time = (v: string | null) => (v ? new Date(v).getTime() : Number.POSITIVE_INFINITY);

function sortContests(items: DiscoveryContest[], sort: ContestDiscoveryFilters["sort"]) {
  const sorted = [...items];
  switch (sort) {
    case "highest_reward":
      sorted.sort((a, b) => (b.contest.rewardPool ?? 0) - (a.contest.rewardPool ?? 0));
      break;
    case "earliest_deadline":
      sorted.sort(
        (a, b) => time(a.contest.applicationDeadline) - time(b.contest.applicationDeadline),
      );
      break;
    case "contest_start":
      sorted.sort((a, b) => time(a.contest.contestStartDate) - time(b.contest.contestStartDate));
      break;
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.contest.publishedAt ?? b.contest.createdAt).getTime() -
          new Date(a.contest.publishedAt ?? a.contest.createdAt).getTime(),
      );
  }
  return sorted;
}

export function decorateForInfluencer(
  contests: Contest[],
  profile: InfluencerEligibilityProfile,
  saved: Set<string>,
): DiscoveryContest[] {
  const now = new Date();
  return contests.map((contest) => ({
    contest,
    eligibility: evaluateEligibility(contest, profile, now),
    availability: evaluateAvailability(contest, now),
    saved: saved.has(contest.id),
  }));
}

/** Search + filter + sort + paginate in one pass; used by every discovery entry point. */
export async function queryDiscovery(
  db: Db,
  userId: string,
  filters: ContestDiscoveryFilters,
): Promise<DiscoveryPage> {
  const [contests, profile, saved] = await Promise.all([
    fetchDiscoverableContests(db),
    loadInfluencerProfile(db, userId),
    loadSavedIds(db, userId),
  ]);

  const filtered = contests.filter((c) => matches(c, filters));
  const decorated = sortContests(
    decorateForInfluencer(filtered, profile, saved),
    filters.sort ?? "newest",
  );

  const pageSize = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), 50);
  const pageCount = Math.max(1, Math.ceil(decorated.length / pageSize));
  const page = Math.min(Math.max(filters.page ?? 1, 1), pageCount);
  const start = (page - 1) * pageSize;

  return {
    items: decorated.slice(start, start + pageSize),
    total: decorated.length,
    page,
    pageSize,
  };
}

/** Admins may read every contest; influencers only discoverable ones. */
export async function canReadContest(db: Db, userId: string, contest: Contest): Promise<boolean> {
  if (isDiscoverable(contest)) return true;
  if (contest.businessId === userId) return true;
  return isAdmin(db, userId);
}

export async function fetchContestById(db: Db, contestId: string): Promise<Contest | null> {
  const { data, error } = await db
    .from("contests")
    .select(CONTEST_COLUMNS)
    .eq("id", contestId)
    .maybeSingle<ContestRow>();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [contest] = await decorate(db, [data]);
  return contest ?? null;
}
