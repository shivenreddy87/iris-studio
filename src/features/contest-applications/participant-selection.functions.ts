import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyContestTransition } from "@/features/contests/contest.server";
import type { Contest } from "@/features/contests/types";
import {
  activateParticipants,
  applySelectionTransition,
  assertSelectionAdmin,
  assertSelectionWindow,
  assertWithinLimit,
  buildSelectionSummary,
  countSelected,
  ensureSelectionStarted,
  fetchContestOrThrow,
  fetchParticipants,
  notifyContestActivated,
  notifyInfluencerDecision,
} from "./participant-selection.server";
import type { ContestApplication, ContestParticipant, SelectionSummaryData } from "./types";

type DecisionInput = { contestId: string; applicationId: string; note?: string };

/** Admin: move an application to Shortlisted. */
export const shortlistApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => data)
  .handler(async ({ data, context }): Promise<ContestApplication> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    assertSelectionWindow(contest);

    const application = await applySelectionTransition(supabase, {
      contest,
      applicationId: data.applicationId,
      to: "shortlisted",
      actorId: userId,
      note: data.note?.trim() || null,
    });

    await notifyInfluencerDecision({
      status: "shortlisted",
      influencerId: application.influencerId,
      applicationId: application.id,
      contestId: contest.id,
      contestTitle: contest.title,
    });

    return application;
  });

/** Admin: select an application as a contest participant. */
export const selectParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => data)
  .handler(async ({ data, context }): Promise<ContestApplication> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    assertSelectionWindow(contest);

    const selected = await countSelected(contest.id);
    assertWithinLimit(contest, selected, 1);

    const application = await applySelectionTransition(supabase, {
      contest,
      applicationId: data.applicationId,
      to: "selected",
      actorId: userId,
      note: data.note?.trim() || null,
    });

    await ensureSelectionStarted(supabase, contest, userId);
    await notifyInfluencerDecision({
      status: "selected",
      influencerId: application.influencerId,
      applicationId: application.id,
      contestId: contest.id,
      contestTitle: contest.title,
    });

    return application;
  });

/** Admin: reject a single application. */
export const rejectApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => data)
  .handler(async ({ data, context }): Promise<ContestApplication> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    assertSelectionWindow(contest);

    const application = await applySelectionTransition(supabase, {
      contest,
      applicationId: data.applicationId,
      to: "rejected",
      actorId: userId,
      note: data.note?.trim() || null,
    });

    await notifyInfluencerDecision({
      status: "rejected",
      influencerId: application.influencerId,
      applicationId: application.id,
      contestId: contest.id,
      contestTitle: contest.title,
    });

    return application;
  });

/** Admin: reject every remaining applicant in one action. */
export const bulkRejectApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string; applicationIds: string[]; note?: string }) => data)
  .handler(async ({ data, context }): Promise<{ rejected: number; failed: number }> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    assertSelectionWindow(contest);

    let rejected = 0;
    let failed = 0;
    for (const applicationId of data.applicationIds) {
      try {
        const application = await applySelectionTransition(supabase, {
          contest,
          applicationId,
          to: "rejected",
          actorId: userId,
          note: data.note?.trim() || null,
        });
        await notifyInfluencerDecision({
          status: "rejected",
          influencerId: application.influencerId,
          applicationId: application.id,
          contestId: contest.id,
          contestTitle: contest.title,
        });
        rejected += 1;
      } catch {
        failed += 1;
      }
    }
    return { rejected, failed };
  });

/** Admin: activate the contest once participants are selected. Irreversible. */
export const activateContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string; note?: string }) => data)
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    let contest = await fetchContestOrThrow(supabase, data.contestId);
    if (contest.status === "archived") throw new Error("This contest has been archived.");

    const selected = await countSelected(contest.id);
    if (selected === 0) {
      throw new Error("Select at least one participant before activating the contest.");
    }

    if (contest.status === "applications_closed") {
      await ensureSelectionStarted(supabase, contest, userId);
      contest = await fetchContestOrThrow(supabase, data.contestId);
    }
    if (contest.status !== "participant_selection") {
      throw new Error("Only a contest in participant selection can be activated.");
    }

    const participantIds = await activateParticipants(contest.id);
    const live = await applyContestTransition(supabase, {
      contestId: contest.id,
      actorId: userId,
      to: "live",
      note: data.note?.trim() || null,
    });

    await notifyContestActivated({
      contestId: contest.id,
      contestTitle: contest.title,
      businessId: contest.businessId,
      participantIds,
      actorId: userId,
      participantCount: participantIds.length,
    });

    return live;
  });

/** Admin: full participant records for a contest. */
export const listContestParticipants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestParticipant[]> => {
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    return fetchParticipants(data.contestId);
  });

/** Admin: participants already selected, used by the selection workspace. */
export const listSelectedParticipants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestParticipant[]> => {
    const { supabase, userId } = context;
    await assertSelectionAdmin(supabase, userId);
    const participants = await fetchParticipants(data.contestId);
    return participants.filter((p) => p.participationStatus === "active");
  });

/** Contest owner or admin: selection totals only, never applicant identities. */
export const getSelectionSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<SelectionSummaryData> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    const { isAdmin } = await import("@/features/contests/contest.server");
    const allowed = contest.businessId === userId || (await isAdmin(supabase, userId));
    if (!allowed) throw new Error("You do not have access to this contest.");
    return buildSelectionSummary(supabase, contest);
  });
