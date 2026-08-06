import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchContestOrThrow } from "@/features/contest-submissions/submission.server";
import { assertAdmin } from "@/features/contests/contest.server";
import {
  assertEvaluationOpen,
  buildContestResults,
  buildEvaluationBoard,
  deleteWinner,
  fetchMyOutcome,
  fetchMySubmissionMetrics,
  fetchMyWins,
  fetchAllWinners,
  fetchResultEvents,
  fetchVerifiedSubmission,
  finalizeContestWinners,
  insertWinner,
  logResultEvent,
  saveSubmissionMetrics,
} from "./winner.server";
import {
  finalizeWinnersSchema,
  markWinnerSchema,
  metricsInputSchema,
  removeWinnerSchema,
} from "./winner.schema";
import type {
  ContestResults,
  ContestWinnerEntry,
  EvaluationBoard,
  MyContestOutcome,
  ResultEvent,
  SubmissionMetricsSummary,
} from "./types";

/** Admin: verified submissions with live scores and ranking. */
export const getEvaluationBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<EvaluationBoard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    return buildEvaluationBoard(contest);
  });

/** Admin: record performance metrics for a verified submission. */
export const updateSubmissionMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => metricsInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<EvaluationBoard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const submission = await fetchVerifiedSubmission(data.submissionId);
    const contest = await fetchContestOrThrow(supabase, submission.contest_id);
    assertEvaluationOpen(contest);
    if (submission.submission_status !== "verified") {
      throw new Error("Only verified submissions can be scored.");
    }

    await saveSubmissionMetrics({
      submissionId: data.submissionId,
      contest,
      views: data.views,
      likes: data.likes,
      comments: data.comments,
      shares: data.shares,
      reviewScore: data.reviewScore ?? null,
      reviewNotes: data.reviewNotes ?? null,
    });

    return buildEvaluationBoard(contest);
  });

/** Admin: current ranking without mutating anything. */
export const calculateRankings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<EvaluationBoard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    return buildEvaluationBoard(contest);
  });

/** Admin: declare a verified submission a winner at a given rank. */
export const markWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => markWinnerSchema.parse(data))
  .handler(async ({ data, context }): Promise<EvaluationBoard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const submission = await fetchVerifiedSubmission(data.submissionId);
    const contest = await fetchContestOrThrow(supabase, submission.contest_id);
    assertEvaluationOpen(contest);

    await insertWinner({
      contest,
      submission,
      rank: data.rank,
      manualScore: data.manualScore ?? null,
      rewardAmount: data.rewardAmount ?? null,
      winnerNotes: data.winnerNotes ?? null,
      actorId: userId,
    });
    await logResultEvent({
      contestId: contest.id,
      actorId: userId,
      eventType: "winner_selected",
      note: `Rank ${data.rank}${data.winnerNotes ? ` — ${data.winnerNotes}` : ""}`,
    });

    return buildEvaluationBoard(contest);
  });

/** Admin: withdraw a winner before finalization. */
export const removeWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => removeWinnerSchema.parse(data))
  .handler(async ({ data, context }): Promise<EvaluationBoard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const submission = await fetchVerifiedSubmission(data.submissionId);
    const contest = await fetchContestOrThrow(supabase, submission.contest_id);
    assertEvaluationOpen(contest);

    await deleteWinner(contest.id, data.submissionId);
    await logResultEvent({
      contestId: contest.id,
      actorId: userId,
      eventType: "winner_removed",
      note: data.note ?? null,
    });

    return buildEvaluationBoard(contest);
  });

/** Admin: lock in the winners and complete the contest. One-way. */
export const finalizeWinners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => finalizeWinnersSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestResults> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    await finalizeContestWinners(supabase, contest, userId, data.note);
    const updated = await fetchContestOrThrow(supabase, data.contestId);
    return buildContestResults(updated);
  });

/** Admin or the owning business: the full contest outcome report. */
export const getContestResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestResults> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    if (contest.businessId !== userId) await assertAdmin(supabase, userId);
    return buildContestResults(contest);
  });

/** Admin, owning business or a participant: the winner rankings. */
export const listContestWinners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestWinnerEntry[]> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    if (contest.businessId !== userId) {
      const { data: participant } = await supabase
        .from("contest_participants")
        .select("id")
        .eq("contest_id", contest.id)
        .eq("influencer_id", userId)
        .maybeSingle();
      if (!participant) await assertAdmin(supabase, userId);
    }
    const results = await buildContestResults(contest);
    return results.winners;
  });

/** Anyone involved in the contest: the result timeline. */
export const listResultEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ResultEvent[]> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    if (contest.businessId !== userId) {
      const { data: participant } = await supabase
        .from("contest_participants")
        .select("id")
        .eq("contest_id", contest.id)
        .eq("influencer_id", userId)
        .maybeSingle();
      if (!participant) await assertAdmin(supabase, userId);
    }
    return fetchResultEvents(contest.id);
  });

/** Influencer: every contest they have won. */
export const listMyContestWins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }): Promise<ContestWinnerEntry[]> => fetchMyWins(context.userId));

/** Influencer: their own outcome for a single contest. */
export const getMyContestOutcome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<MyContestOutcome> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    return fetchMyOutcome(contest, userId);
  });

/** Influencer: the performance metrics recorded against their own submission. */
export const getMySubmissionMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<SubmissionMetricsSummary | null> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    return fetchMySubmissionMetrics(contest, userId);
  });

/** Influencer: every contest they have won. */
export const listMyWins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContestWinnerEntry[]> => fetchMyWins(context.userId));

/** Admin: every declared winner across the platform. */
export const listAllWinners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContestWinnerEntry[]> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchAllWinners();
  });
