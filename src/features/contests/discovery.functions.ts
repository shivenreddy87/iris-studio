import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchContestEvents } from "./contest.server";
import { evaluateAvailability, evaluateEligibility, type EligibilityResult } from "./eligibility";
import {
  canReadContest,
  fetchContestById,
  loadInfluencerProfile,
  loadSavedIds,
  queryDiscovery,
} from "./discovery.server";
import type { ContestDetailForInfluencer, ContestDiscoveryFilters, DiscoveryPage } from "./types";

/** Paginated discovery feed: contest + eligibility + saved state in one response. */
export const listDiscoverableContests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ContestDiscoveryFilters | undefined) => data ?? {})
  .handler(
    async ({ data, context }): Promise<DiscoveryPage> =>
      queryDiscovery(context.supabase, context.userId, data),
  );

/** Search-only entry point; same core query as the discovery feed. */
export const searchContests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search: string } & ContestDiscoveryFilters) => data)
  .handler(
    async ({ data, context }): Promise<DiscoveryPage> =>
      queryDiscovery(context.supabase, context.userId, data),
  );

/** Filter-only entry point; same core query as the discovery feed. */
export const filterContests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ContestDiscoveryFilters) => data)
  .handler(
    async ({ data, context }): Promise<DiscoveryPage> =>
      queryDiscovery(context.supabase, context.userId, data),
  );

/** One contest with eligibility, availability, saved state and its timeline. */
export const getContestForInfluencer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestDetailForInfluencer> => {
    const contest = await fetchContestById(context.supabase, data.contestId);
    if (!contest) throw new Error("Contest not found.");
    if (!(await canReadContest(context.supabase, context.userId, contest))) {
      throw new Error("Contest not found.");
    }

    const [profile, saved, events] = await Promise.all([
      loadInfluencerProfile(context.supabase, context.userId),
      loadSavedIds(context.supabase, context.userId),
      fetchContestEvents(context.supabase, contest.id),
    ]);
    const now = new Date();

    return {
      contest,
      eligibility: evaluateEligibility(contest, profile, now),
      availability: evaluateAvailability(contest, now),
      saved: saved.has(contest.id),
      events,
    };
  });

/** Eligibility on its own — reused by the upcoming application validation layer. */
export const calculateEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<EligibilityResult> => {
    const contest = await fetchContestById(context.supabase, data.contestId);
    if (!contest) throw new Error("Contest not found.");
    const profile = await loadInfluencerProfile(context.supabase, context.userId);
    return evaluateEligibility(contest, profile);
  });
