import type { Db } from "@/features/contest-applications/application.server";
import {
  assertAdmin,
  fetchContestOrThrow,
  type SubmissionRow,
} from "@/features/contest-submissions/submission.server";
import type { Contest } from "@/features/contests/types";
import {
  calculateContestStatistics,
  calculateEngagementRate,
  calculatePerformanceScore,
  defaultRewardAmount,
  rankContestSubmissions,
  resolveFinalScore,
} from "./scoring";
import type {
  ContestResults,
  ContestWinnerEntry,
  EvaluationBoard,
  EvaluationEntry,
  MyContestOutcome,
  ResultEvent,
  ResultEventType,
  SubmissionMetricsSummary,
} from "./types";

export type { Db };

/** Metric columns added for winner evaluation. */
const METRIC_COLUMNS =
  "id, contest_id, participant_id, influencer_id, platform, content_url, submission_status, submitted_at, views, likes, comments, shares, engagement_rate, review_score, review_notes";

type MetricRow = Pick<
  SubmissionRow,
  "id" | "contest_id" | "participant_id" | "influencer_id" | "platform" | "content_url" | "submitted_at"
> & {
  submission_status: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  review_score: number | null;
  review_notes: string | null;
};

type WinnerRow = {
  id: string;
  contest_id: string;
  participant_id: string;
  submission_id: string;
  influencer_id: string;
  rank: number;
  performance_score: number;
  manual_score: number | null;
  final_score: number;
  reward_amount: number | null;
  winner_notes: string | null;
  selected_at: string;
};

const WINNER_COLUMNS =
  "id, contest_id, participant_id, submission_id, influencer_id, rank, performance_score, manual_score, final_score, reward_amount, winner_notes, selected_at";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------------ */
/* Guards                                                              */
/* ------------------------------------------------------------------ */

/** Results are frozen once a contest completes; every mutation is rejected. */
export function assertEvaluationOpen(contest: Contest): void {
  if (contest.status === "completed" || contest.status === "archived") {
    throw new Error("This contest is completed. Results can no longer be changed.");
  }
  if (contest.status !== "live") {
    throw new Error("Winners can only be evaluated while the contest is live.");
  }
}

export async function assertAdminCaller(db: Db, userId: string): Promise<void> {
  await assertAdmin(db, userId);
}

export { fetchContestOrThrow };

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

async function loadInfluencerDetails(userIds: string[]) {
  const map = new Map<string, { name: string | null; handle: string | null }>();
  if (userIds.length === 0) return map;
  const sb = await admin();
  const [{ data: profiles }, { data: creators }] = await Promise.all([
    sb.from("profiles").select("id, full_name").in("id", userIds),
    sb.from("creator_profiles").select("user_id, display_name, handle").in("user_id", userIds),
  ]);
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id as string, c]));
  for (const id of userIds) {
    const creator = creatorMap.get(id);
    const profile = (profiles ?? []).find((p) => p.id === id);
    map.set(id, {
      name: (creator?.display_name as string | null) ?? (profile?.full_name as string | null) ?? null,
      handle: (creator?.handle as string | null) ?? null,
    });
  }
  return map;
}

async function loadPortfolios(participantIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (participantIds.length === 0) return map;
  const sb = await admin();
  const { data: participants } = await sb
    .from("contest_participants")
    .select("id, application_id")
    .in("id", participantIds);
  const applicationIds = [...new Set((participants ?? []).map((p) => p.application_id as string))];
  if (applicationIds.length === 0) return map;
  const { data: applications } = await sb
    .from("contest_applications")
    .select("id, portfolio_url")
    .in("id", applicationIds);
  const byApplication = new Map(
    (applications ?? []).map((a) => [a.id as string, (a.portfolio_url as string | null) ?? null]),
  );
  for (const participant of participants ?? []) {
    map.set(
      participant.id as string,
      byApplication.get(participant.application_id as string) ?? null,
    );
  }
  return map;
}

async function fetchVerifiedRows(contestId: string): Promise<MetricRow[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_submissions")
    .select(METRIC_COLUMNS)
    .eq("contest_id", contestId)
    .eq("submission_status", "verified")
    .returns<MetricRow[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchWinnerRows(contestId: string): Promise<WinnerRow[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_winners")
    .select(WINNER_COLUMNS)
    .eq("contest_id", contestId)
    .order("rank", { ascending: true })
    .returns<WinnerRow[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Verified submissions, scored and ranked, plus current winner state. */
export async function buildEvaluationBoard(contest: Contest): Promise<EvaluationBoard> {
  const [rows, winners] = await Promise.all([
    fetchVerifiedRows(contest.id),
    fetchWinnerRows(contest.id),
  ]);

  const details = await loadInfluencerDetails([...new Set(rows.map((r) => r.influencer_id))]);
  const portfolios = await loadPortfolios([...new Set(rows.map((r) => r.participant_id))]);
  const winnerBySubmission = new Map(winners.map((w) => [w.submission_id, w]));

  const scored = rows.map((row) => {
    const metrics = {
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      reviewScore: row.review_score,
    };
    const winner = winnerBySubmission.get(row.id) ?? null;
    const performanceScore = calculatePerformanceScore(metrics, {
      requiredViews: contest.requiredViews,
    });
    const manualScore = winner?.manual_score ?? null;
    return {
      id: row.id,
      row,
      metrics,
      engagementRate: calculateEngagementRate(metrics),
      performanceScore,
      manualScore,
      finalScore: resolveFinalScore(performanceScore, manualScore),
      submittedAt: row.submitted_at,
      views: metrics.views,
      winner,
    };
  });

  const ranked = rankContestSubmissions(
    scored.map((item) => ({
      id: item.id,
      finalScore: item.finalScore,
      views: item.views,
      engagementRate: item.engagementRate,
      submittedAt: item.submittedAt,
    })),
  );
  const rankById = new Map(ranked.map((r) => [r.id, r.rank]));

  const entries: EvaluationEntry[] = scored
    .map((item) => {
      const detail = details.get(item.row.influencer_id);
      return {
        submissionId: item.id,
        participantId: item.row.participant_id,
        influencerId: item.row.influencer_id,
        influencerName: detail?.name ?? null,
        influencerHandle: detail?.handle ?? null,
        portfolioUrl: portfolios.get(item.row.participant_id) ?? null,
        platform: item.row.platform,
        contentUrl: item.row.content_url,
        submittedAt: item.row.submitted_at,
        views: item.metrics.views,
        likes: item.metrics.likes,
        comments: item.metrics.comments,
        shares: item.metrics.shares,
        engagementRate: item.engagementRate,
        reviewScore: item.row.review_score,
        reviewNotes: item.row.review_notes,
        performanceScore: item.performanceScore,
        manualScore: item.manualScore,
        finalScore: item.finalScore,
        rank: rankById.get(item.id) ?? 0,
        isWinner: Boolean(item.winner),
        winnerRank: item.winner?.rank ?? null,
        rewardAmount: item.winner?.reward_amount ?? null,
        winnerNotes: item.winner?.winner_notes ?? null,
      } satisfies EvaluationEntry;
    })
    .sort((a, b) => a.rank - b.rank);

  const isLocked = contest.status === "completed" || contest.status === "archived";

  return {
    contest,
    entries,
    winnerCount: contest.winnerCount ?? 0,
    winnersSelected: winners.length,
    isLocked,
    lockReason: isLocked ? "This contest is completed. Results are final." : null,
    defaultReward: defaultRewardAmount(contest.rewardPool, contest.winnerCount),
  };
}

async function buildWinnerEntries(
  contest: Contest,
  winners: WinnerRow[],
): Promise<ContestWinnerEntry[]> {
  if (winners.length === 0) return [];
  const sb = await admin();
  const details = await loadInfluencerDetails([...new Set(winners.map((w) => w.influencer_id))]);
  const { data: submissions } = await sb
    .from("contest_submissions")
    .select("id, content_url, views, engagement_rate")
    .in("id", winners.map((w) => w.submission_id));
  const submissionMap = new Map((submissions ?? []).map((s) => [s.id as string, s]));

  return winners.map((winner) => {
    const detail = details.get(winner.influencer_id);
    const submission = submissionMap.get(winner.submission_id);
    return {
      id: winner.id,
      contestId: winner.contest_id,
      contestTitle: contest.title,
      businessCategory: contest.businessCategory,
      submissionId: winner.submission_id,
      participantId: winner.participant_id,
      influencerId: winner.influencer_id,
      influencerName: detail?.name ?? null,
      influencerHandle: detail?.handle ?? null,
      rank: winner.rank,
      performanceScore: winner.performance_score,
      manualScore: winner.manual_score,
      finalScore: winner.final_score,
      rewardAmount: winner.reward_amount,
      winnerNotes: winner.winner_notes,
      selectedAt: winner.selected_at,
      completedAt: contest.status === "completed" || contest.status === "archived"
        ? (contest.archivedAt ?? contest.updatedAt)
        : null,
      contentUrl: (submission?.content_url as string | undefined) ?? null,
      views: (submission?.views as number | undefined) ?? 0,
      engagementRate: (submission?.engagement_rate as number | undefined) ?? 0,
    } satisfies ContestWinnerEntry;
  });
}

export async function fetchResultEvents(contestId: string): Promise<ResultEvent[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_result_events")
    .select("id, contest_id, actor_id, event_type, note, created_at")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await sb.from("profiles").select("id, full_name").in("id", actorIds);
    for (const profile of profiles ?? []) {
      names.set(profile.id as string, profile.full_name as string | null);
    }
  }
  return rows.map((row) => ({
    id: row.id as string,
    contestId: row.contest_id as string,
    eventType: row.event_type as ResultEventType,
    actorId: (row.actor_id as string | null) ?? null,
    actorName: row.actor_id ? (names.get(row.actor_id as string) ?? null) : null,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function logResultEvent(input: {
  contestId: string;
  actorId: string | null;
  eventType: ResultEventType;
  note?: string | null;
}): Promise<void> {
  const sb = await admin();
  const { error } = await sb.from("contest_result_events").insert({
    contest_id: input.contestId,
    actor_id: input.actorId,
    event_type: input.eventType,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Full outcome report. Safe for admins and the owning business. */
export async function buildContestResults(contest: Contest): Promise<ContestResults> {
  const sb = await admin();
  const [{ count: participantCount }, verified, winners, events] = await Promise.all([
    sb
      .from("contest_participants")
      .select("id", { count: "exact", head: true })
      .eq("contest_id", contest.id),
    fetchVerifiedRows(contest.id),
    fetchWinnerRows(contest.id),
    fetchResultEvents(contest.id),
  ]);

  const statistics = calculateContestStatistics(
    verified.map((row) => ({
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      reviewScore: row.review_score,
      engagementRate: calculateEngagementRate({
        views: row.views ?? 0,
        likes: row.likes ?? 0,
        comments: row.comments ?? 0,
        shares: row.shares ?? 0,
      }),
      finalScore: calculatePerformanceScore(
        {
          views: row.views ?? 0,
          likes: row.likes ?? 0,
          comments: row.comments ?? 0,
          shares: row.shares ?? 0,
          reviewScore: row.review_score,
        },
        { requiredViews: contest.requiredViews },
      ),
    })),
  );

  return {
    contestId: contest.id,
    contestTitle: contest.title,
    contestStatus: contest.status,
    completedAt:
      contest.status === "completed" || contest.status === "archived"
        ? (contest.archivedAt ?? contest.updatedAt)
        : null,
    totalParticipants: participantCount ?? 0,
    verifiedSubmissions: verified.length,
    winnerCount: contest.winnerCount ?? winners.length,
    winners: await buildWinnerEntries(contest, winners),
    statistics,
    events,
  };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function saveSubmissionMetrics(input: {
  submissionId: string;
  contest: Contest;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reviewScore: number | null;
  reviewNotes: string | null;
}): Promise<void> {
  const engagementRate = calculateEngagementRate(input);
  const sb = await admin();
  const { error } = await sb
    .from("contest_submissions")
    .update({
      views: input.views,
      likes: input.likes,
      comments: input.comments,
      shares: input.shares,
      engagement_rate: engagementRate,
      review_score: input.reviewScore,
      review_notes: input.reviewNotes,
    })
    .eq("id", input.submissionId);
  if (error) throw new Error(error.message);
}

export async function fetchVerifiedSubmission(submissionId: string): Promise<MetricRow> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_submissions")
    .select(METRIC_COLUMNS)
    .eq("id", submissionId)
    .maybeSingle<MetricRow>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Submission not found.");
  return data;
}

export async function insertWinner(input: {
  contest: Contest;
  submission: MetricRow;
  rank: number;
  manualScore: number | null;
  rewardAmount: number | null;
  winnerNotes: string | null;
  actorId: string;
}): Promise<void> {
  const { contest, submission } = input;
  if (submission.submission_status !== "verified") {
    throw new Error("Only verified submissions can be selected as winners.");
  }

  const winners = await fetchWinnerRows(contest.id);
  const limit = contest.winnerCount ?? 0;
  if (limit > 0 && winners.length >= limit) {
    throw new Error(`This contest allows ${limit} winner${limit === 1 ? "" : "s"}.`);
  }
  if (limit > 0 && input.rank > limit) {
    throw new Error(`Rank must be between 1 and ${limit}.`);
  }
  if (winners.some((w) => w.influencer_id === submission.influencer_id)) {
    throw new Error("This influencer is already a winner of this contest.");
  }
  if (winners.some((w) => w.rank === input.rank)) {
    throw new Error(`Rank ${input.rank} is already taken.`);
  }

  const performanceScore = calculatePerformanceScore(
    {
      views: submission.views ?? 0,
      likes: submission.likes ?? 0,
      comments: submission.comments ?? 0,
      shares: submission.shares ?? 0,
      reviewScore: submission.review_score,
    },
    { requiredViews: contest.requiredViews },
  );

  const sb = await admin();
  const { error } = await sb.from("contest_winners").insert({
    contest_id: contest.id,
    participant_id: submission.participant_id,
    submission_id: submission.id,
    influencer_id: submission.influencer_id,
    rank: input.rank,
    performance_score: performanceScore,
    manual_score: input.manualScore,
    final_score: resolveFinalScore(performanceScore, input.manualScore),
    reward_amount:
      input.rewardAmount ?? defaultRewardAmount(contest.rewardPool, contest.winnerCount),
    winner_notes: input.winnerNotes,
    selected_by: input.actorId,
  });
  if (error) {
    if (error.code === "23505") throw new Error("That rank or influencer is already a winner.");
    throw new Error(error.message);
  }
}

export async function deleteWinner(contestId: string, submissionId: string): Promise<void> {
  const sb = await admin();
  const { error } = await sb
    .from("contest_winners")
    .delete()
    .eq("contest_id", contestId)
    .eq("submission_id", submissionId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

type NotificationRow = {
  user_id: string;
  kind: "system";
  title: string;
  body: string;
  link: string;
};

async function insertNotifications(rows: NotificationRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sb = await admin();
  await sb.from("notifications").insert(rows);
}

async function adminUserIds(): Promise<string[]> {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  return (data ?? []).map((row) => row.user_id as string);
}

/** Announce the final outcome to winners, participants, business and admins. */
export async function notifyContestCompleted(input: {
  contest: Contest;
  winners: WinnerRow[];
}): Promise<void> {
  const { contest } = input;
  const sb = await admin();
  const { data: participants } = await sb
    .from("contest_participants")
    .select("influencer_id")
    .eq("contest_id", contest.id);

  const winnerIds = new Set(input.winners.map((w) => w.influencer_id));
  const rows: NotificationRow[] = [];

  for (const winner of input.winners) {
    rows.push({
      user_id: winner.influencer_id,
      kind: "system",
      title: "You won this contest",
      body: `You placed #${winner.rank} in “${contest.title}”.`,
      link: `/app/contests/won`,
    });
  }

  for (const participant of participants ?? []) {
    const id = participant.influencer_id as string;
    if (winnerIds.has(id)) continue;
    rows.push({
      user_id: id,
      kind: "system",
      title: "Contest completed",
      body: `“${contest.title}” has been completed and the results are available.`,
      link: `/app/contests/completed`,
    });
  }

  rows.push({
    user_id: contest.businessId,
    kind: "system",
    title: "Contest completed",
    body: `Winners have been finalized for “${contest.title}”. The results report is ready.`,
    link: `/app/business/contests/${contest.id}`,
  });

  for (const id of await adminUserIds()) {
    rows.push({
      user_id: id,
      kind: "system",
      title: "Winners finalized",
      body: `“${contest.title}” has been completed.`,
      link: `/app/admin/contests/${contest.id}`,
    });
  }

  await insertNotifications(rows);
}

/** Finalize: requires the configured number of winners, then completes. */
export async function finalizeContestWinners(
  db: Db,
  contest: Contest,
  actorId: string,
  note?: string,
): Promise<WinnerRow[]> {
  assertEvaluationOpen(contest);
  const winners = await fetchWinnerRows(contest.id);
  if (winners.length === 0) throw new Error("Select at least one winner before finalizing.");
  const limit = contest.winnerCount ?? 0;
  if (limit > 0 && winners.length !== limit) {
    throw new Error(
      `Select all ${limit} winner${limit === 1 ? "" : "s"} before finalizing. ${winners.length} selected.`,
    );
  }

  const { applyContestTransition } = await import("@/features/contests/contest.server");
  await applyContestTransition(db, {
    contestId: contest.id,
    actorId,
    to: "completed",
    ...(note ? { note } : {}),
  });

  await logResultEvent({
    contestId: contest.id,
    actorId,
    eventType: "winner_finalized",
    note: note ?? null,
  });
  await logResultEvent({
    contestId: contest.id,
    actorId,
    eventType: "contest_completed",
    note: null,
  });
  await notifyContestCompleted({ contest, winners });
  return winners;
}

/** Influencer: their own wins across every contest. */
export async function fetchMyWins(userId: string): Promise<ContestWinnerEntry[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_winners")
    .select(WINNER_COLUMNS)
    .eq("influencer_id", userId)
    .order("selected_at", { ascending: false })
    .returns<WinnerRow[]>();
  if (error) throw new Error(error.message);
  const winners = data ?? [];
  if (winners.length === 0) return [];

  const { CONTEST_COLUMNS, toContest } = await import("@/features/contests/contest.server");
  const { data: contestRows } = await sb
    .from("contests")
    .select(CONTEST_COLUMNS)
    .in("id", [...new Set(winners.map((w) => w.contest_id))]);
  const contests = new Map(
    ((contestRows ?? []) as Parameters<typeof toContest>[0][]).map((row) => {
      const contest = toContest(row);
      return [contest.id, contest];
    }),
  );

  const entries: ContestWinnerEntry[] = [];
  for (const winner of winners) {
    const contest = contests.get(winner.contest_id);
    if (!contest) continue;
    // Wins are only visible to the influencer once the contest is finalized.
    if (contest.status !== "completed" && contest.status !== "archived") continue;
    const [entry] = await buildWinnerEntries(contest, [winner]);
    if (entry) entries.push(entry);
  }
  return entries;
}

/** Influencer: winner state for one of their contests. */
export async function fetchMyOutcome(
  contest: Contest,
  userId: string,
): Promise<MyContestOutcome> {
  const sb = await admin();
  const { data } = await sb
    .from("contest_winners")
    .select(WINNER_COLUMNS)
    .eq("contest_id", contest.id)
    .eq("influencer_id", userId)
    .maybeSingle<WinnerRow>();

  const finalized = contest.status === "completed" || contest.status === "archived";
  return {
    contestId: contest.id,
    contestTitle: contest.title,
    contestStatus: contest.status,
    isWinner: finalized && Boolean(data),
    rank: finalized ? (data?.rank ?? null) : null,
    rewardAmount: finalized ? (data?.reward_amount ?? null) : null,
    completedAt: finalized ? (contest.archivedAt ?? contest.updatedAt) : null,
  };
}

/**
 * Influencer: the metrics recorded against their own submission.
 * Scores stay hidden until the contest is finalized so rankings can't leak early.
 */
export async function fetchMySubmissionMetrics(
  contest: Contest,
  userId: string,
): Promise<SubmissionMetricsSummary | null> {
  const sb = await admin();
  const { data } = await sb
    .from("contest_submissions")
    .select(METRIC_COLUMNS)
    .eq("contest_id", contest.id)
    .eq("influencer_id", userId)
    .maybeSingle<MetricRow>();
  if (!data) return null;

  const published = contest.status === "completed" || contest.status === "archived";
  const metrics = {
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    reviewScore: data.review_score,
  };
  const engagementRate = calculateEngagementRate(metrics);
  const performanceScore = calculatePerformanceScore(metrics, {
    requiredViews: contest.requiredViews,
  });
  return {
    submissionId: data.id,
    contestId: contest.id,
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    engagementRate,
    performanceScore: published ? performanceScore : 0,
    finalScore: published ? resolveFinalScore(performanceScore, null) : 0,
    reviewScore: published ? data.review_score : null,
    published,
  };
}

/** Admin: every declared winner across finalized contests, newest first. */
export async function fetchAllWinners(): Promise<ContestWinnerEntry[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_winners")
    .select(WINNER_COLUMNS)
    .order("selected_at", { ascending: false })
    .limit(200)
    .returns<WinnerRow[]>();
  if (error) throw new Error(error.message);
  const winners = data ?? [];
  if (winners.length === 0) return [];

  const { CONTEST_COLUMNS, toContest } = await import("@/features/contests/contest.server");
  const { data: contestRows } = await sb
    .from("contests")
    .select(CONTEST_COLUMNS)
    .in("id", [...new Set(winners.map((w) => w.contest_id))]);
  const contests = new Map(
    ((contestRows ?? []) as Parameters<typeof toContest>[0][]).map((row) => {
      const contest = toContest(row);
      return [contest.id, contest];
    }),
  );

  const entries: ContestWinnerEntry[] = [];
  for (const winner of winners) {
    const contest = contests.get(winner.contest_id);
    if (!contest) continue;
    const [entry] = await buildWinnerEntries(contest, [winner]);
    if (entry) entries.push(entry);
  }
  return entries;
}
