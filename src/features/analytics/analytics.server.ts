/**
 * Analytics aggregation layer.
 *
 * All heavy lifting lives here so that server functions stay thin and no
 * component ever queries Supabase directly. Reads use the service client
 * *after* the calling server function has authorised the request (admin
 * check, or scoping to `context.userId`).
 */

import type {
  Achievement,
  BusinessAnalytics,
  CampaignAnalytics,
  ContestAnalytics,
  InfluencerAnalytics,
  PayoutAnalytics,
  PlatformAnalytics,
  SeriesPoint,
  SubmissionAnalytics,
  WinnerAnalytics,
} from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------- helpers -------------------------------- */

const DAY = 24 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDay(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Bucket ISO timestamps into a dense daily series covering `days` back. */
export function dailySeries(dates: (string | null | undefined)[], days = 30): SeriesPoint[] {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    if (!iso) continue;
    const key = dayKey(iso);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const end = Date.now();
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = new Date(end - i * DAY).toISOString().slice(0, 10);
    out.push({ label: formatDay(key), value: counts.get(key) ?? 0 });
  }
  return out;
}

function countBy<T extends string>(
  rows: { [k: string]: unknown }[],
  field: string,
): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const row of rows) {
    const key = String(row[field] ?? "unknown") as T;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function toSeries(counts: Record<string, number>): SeriesPoint[] {
  return Object.entries(counts)
    .map(([label, value]) => ({ label: humanise(label), value }))
    .sort((a, b) => b.value - a.value);
}

function humanise(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function avg(values: (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/* ------------------------------- platform ------------------------------- */

export async function fetchPlatformAnalytics(days = 30): Promise<PlatformAnalytics> {
  const db = await admin();
  const [
    roles,
    requests,
    contests,
    applications,
    participants,
    submissions,
    winners,
    payouts,
    suspensions,
    moderation,
    profiles,
  ] = await Promise.all([
    db.from("user_roles").select("user_id, role, created_at"),
    db.from("campaign_requests").select("id, status, created_at, reviewed_at, submitted_at"),
    db.from("contests").select("id, status, created_at"),
    db.from("contest_applications").select("id, status, created_at"),
    db.from("contest_participants").select("id, created_at"),
    db.from("contest_submissions").select("id, submission_status, engagement_rate, created_at"),
    db.from("contest_winners").select("id, reward_amount"),
    db.from("payouts").select("id, status, amount, created_at, requested_at"),
    db.from("user_suspensions").select("id, lifted_at"),
    db.from("moderation_records").select("id, action, created_at"),
    db.from("profiles").select("id, created_at"),
  ]);

  const roleRows = roles.data ?? [];
  const requestRows = requests.data ?? [];
  const contestRows = contests.data ?? [];
  const applicationRows = applications.data ?? [];
  const submissionRows = submissions.data ?? [];
  const payoutRows = payouts.data ?? [];
  const suspensionRows = suspensions.data ?? [];
  const moderationRows = moderation.data ?? [];

  const requestStatus = countBy(requestRows, "status");
  const contestStatus = countBy(contestRows, "status");
  const payoutStatus = countBy(payoutRows, "status");

  const since = Date.now() - days * DAY;
  const businessIds = new Set(roleRows.filter((r) => r.role === "brand").map((r) => r.user_id));
  const influencerIds = new Set(roleRows.filter((r) => r.role === "creator").map((r) => r.user_id));
  const profileRows = profiles.data ?? [];

  return {
    users: {
      total: profileRows.length,
      businesses: businessIds.size,
      influencers: influencerIds.size,
      suspended: suspensionRows.filter((s) => !s.lifted_at).length,
    },
    requests: {
      total: requestRows.length,
      pending: (requestStatus["submitted"] ?? 0) + (requestStatus["under_review"] ?? 0),
      approved: requestStatus["approved"] ?? 0,
      rejected: requestStatus["rejected"] ?? 0,
    },
    contests: {
      total: contestRows.length,
      live: contestStatus["live"] ?? 0,
      completed: contestStatus["completed"] ?? 0,
      draft: contestStatus["draft"] ?? 0,
      applicationsOpen: contestStatus["applications_open"] ?? 0,
    },
    engagement: {
      applications: applicationRows.length,
      participants: (participants.data ?? []).length,
      submissions: submissionRows.length,
      verified: submissionRows.filter((s) => s.submission_status === "verified").length,
      avgEngagement: avg(submissionRows.map((s) => s.engagement_rate)),
    },
    rewards: {
      awarded: sum((winners.data ?? []).map((w) => w.reward_amount)),
      paid: sum(payoutRows.filter((p) => p.status === "paid").map((p) => p.amount)),
      pending: sum(
        payoutRows
          .filter((p) => p.status !== "paid" && p.status !== "cancelled" && p.status !== "failed")
          .map((p) => p.amount),
      ),
      failed: sum(payoutRows.filter((p) => p.status === "failed").map((p) => p.amount)),
    },
    growth: {
      businesses: dailySeries(
        roleRows.filter((r) => r.role === "brand").map((r) => r.created_at),
        days,
      ),
      influencers: dailySeries(
        roleRows.filter((r) => r.role === "creator").map((r) => r.created_at),
        days,
      ),
      contests: dailySeries(
        contestRows.map((c) => c.created_at),
        days,
      ),
      applications: dailySeries(
        applicationRows.map((a) => a.created_at),
        days,
      ),
    },
    moderation: {
      openFlags: moderationRows.filter((m) => m.action === "flag").length,
      activeSuspensions: suspensionRows.filter((s) => !s.lifted_at).length,
      recentActions: moderationRows.filter((m) => new Date(m.created_at).getTime() >= since).length,
    },
    health: {
      stuckRequests: requestRows.filter(
        (r) =>
          (r.status === "submitted" || r.status === "under_review") &&
          r.submitted_at !== null &&
          Date.now() - new Date(r.submitted_at).getTime() > 3 * DAY,
      ).length,
      contestsWithoutParticipants: contestRows.filter((c) => c.status === "participant_selection")
        .length,
      unverifiedSubmissions: submissionRows.filter((s) => s.submission_status === "submitted")
        .length,
      stalePayouts: payoutRows.filter(
        (p) =>
          (p.status === "waiting_for_details" || p.status === "details_requested") &&
          p.requested_at !== null &&
          Date.now() - new Date(p.requested_at).getTime() > 7 * DAY,
      ).length,
    },
  };
}

/* ------------------------------- business ------------------------------- */

export async function fetchBusinessAnalytics(
  businessId: string,
  days = 30,
): Promise<BusinessAnalytics> {
  const db = await admin();
  const [requests, contests] = await Promise.all([
    db.from("campaign_requests").select("id, status, created_at").eq("business_id", businessId),
    db
      .from("contests")
      .select("id, title, status, created_at, contest_end_date")
      .eq("business_id", businessId),
  ]);

  const requestRows = requests.data ?? [];
  const contestRows = contests.data ?? [];
  const contestIds = contestRows.map((c) => c.id);

  const [applications, participants, submissions, payouts, winners] = contestIds.length
    ? await Promise.all([
        db.from("contest_applications").select("id, created_at").in("contest_id", contestIds),
        db.from("contest_participants").select("id").in("contest_id", contestIds),
        db
          .from("contest_submissions")
          .select("id, submission_status, engagement_rate, views")
          .in("contest_id", contestIds),
        db.from("payouts").select("id, amount, status").in("contest_id", contestIds),
        db
          .from("contest_winners")
          .select("id, reward_amount")
          .in("contest_id", contestIds),
      ])
    : [
        { data: [] as { id: string; created_at: string }[] },
        { data: [] as { id: string }[] },
        {
          data: [] as {
            id: string;
            submission_status: string;
            engagement_rate: number | null;
            views: number | null;
          }[],
        },
        { data: [] as { id: string; amount: number; status: string }[] },
        { data: [] as { id: string; reward_amount: number | null }[] },
      ];

  const applicationRows = applications.data ?? [];
  const participantRows = participants.data ?? [];
  const submissionRows = submissions.data ?? [];
  const payoutRows = payouts.data ?? [];
  const winnerRows = winners.data ?? [];

  // Verified metrics only: pending content contributes nothing to performance.
  const verifiedRows = submissionRows.filter((s) => s.submission_status === "verified");
  const verifiedViews = sum(verifiedRows.map((s) => Number(s.views ?? 0)));
  const rewardCommitted = sum(winnerRows.map((w) => Number(w.reward_amount ?? 0)));
  const tierDistribution = toSeries(
    winnerRows.reduce<Record<string, number>>((acc, w) => {
      const amount = Number(w.reward_amount ?? 0);
      if (!amount) return acc;
      const label = `₹${amount.toLocaleString("en-IN")}`;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const completed = contestRows.filter((c) => c.status === "completed");
  const completionDays = completed
    .map((c) => {
      if (!c.contest_end_date) return null;
      return Math.max(
        0,
        Math.round(
          (new Date(c.contest_end_date).getTime() - new Date(c.created_at).getTime()) / DAY,
        ),
      );
    })
    .filter((v): v is number => v !== null);

  const approved = requestRows.filter((r) => r.status === "approved").length;
  const verified = submissionRows.filter((s) => s.submission_status === "verified").length;

  return {
    requestsCreated: requestRows.length,
    requestsApproved: approved,
    approvedRate: pct(approved, requestRows.length),
    contestsCreated: contestRows.length,
    contestsCompleted: completed.length,
    contestSuccessRate: pct(completed.length, contestRows.length),
    applicationsReceived: applicationRows.length,
    participantsSelected: participantRows.length,
    submissionsReceived: submissionRows.length,
    submissionProgress: pct(submissionRows.length, participantRows.length),
    verifiedContent: verified,
    completionRate: pct(verified, submissionRows.length),
    rewardDistributed: sum(payoutRows.filter((p) => p.status === "paid").map((p) => p.amount)),
    verifiedViews,
    avgVerifiedViews: verifiedRows.length ? Math.round(verifiedViews / verifiedRows.length) : 0,
    costPerVerifiedView: verifiedViews
      ? Math.round((rewardCommitted / verifiedViews) * 100) / 100
      : 0,
    rewardTierDistribution: tierDistribution,
    avgEngagement: avg(verifiedRows.map((s) => s.engagement_rate)),
    avgCompletionDays: completionDays.length ? avg(completionDays) : 0,
    applicationsOverTime: dailySeries(
      applicationRows.map((a) => a.created_at),
      days,
    ),
    contestBreakdown: toSeries(countBy(contestRows, "status")),
  };
}

/* ------------------------------ influencer ------------------------------ */

export async function fetchInfluencerAnalytics(
  influencerId: string,
  days = 30,
): Promise<InfluencerAnalytics> {
  const db = await admin();
  const [applications, participants, submissions, winners, payouts, definitions, earned] =
    await Promise.all([
      db
        .from("contest_applications")
        .select("id, status, contest_id, created_at")
        .eq("influencer_id", influencerId),
      db
        .from("contest_participants")
        .select("id, contest_id, selected_at, participation_status")
        .eq("influencer_id", influencerId),
      db
        .from("contest_submissions")
        .select(
          "id, contest_id, submission_status, engagement_rate, views, submitted_at, created_at",
        )
        .eq("influencer_id", influencerId),
      db
        .from("contest_winners")
        .select("id, contest_id, rank, final_score, reward_amount, selected_at")
        .eq("influencer_id", influencerId),
      db.from("payouts").select("id, amount, status").eq("influencer_id", influencerId),
      db
        .from("achievement_definitions")
        .select("code, title, description, icon, sort_order")
        .order("sort_order"),
      db.from("user_achievements").select("code, awarded_at").eq("user_id", influencerId),
    ]);

  const applicationRows = applications.data ?? [];
  const participantRows = participants.data ?? [];
  const submissionRows = submissions.data ?? [];
  const winnerRows = winners.data ?? [];
  const payoutRows = payouts.data ?? [];

  const contestIds = Array.from(new Set(participantRows.map((p) => p.contest_id)));
  const { data: contestRows } = contestIds.length
    ? await db.from("contests").select("id, status").in("id", contestIds)
    : { data: [] as { id: string; status: string }[] };

  const selectedAtByContest = new Map(participantRows.map((p) => [p.contest_id, p.selected_at]));
  const submissionHours = submissionRows
    .map((s) => {
      const selected = selectedAtByContest.get(s.contest_id);
      if (!selected || !s.submitted_at) return null;
      return Math.max(
        0,
        (new Date(s.submitted_at).getTime() - new Date(selected).getTime()) / (60 * 60 * 1000),
      );
    })
    .filter((v): v is number => v !== null);

  const accepted = applicationRows.filter(
    (a) => a.status === "shortlisted" || a.status === "selected",
  ).length;

  const earnedMap = new Map((earned.data ?? []).map((row) => [row.code, row.awarded_at]));
  const achievements: Achievement[] = (definitions.data ?? []).map((def) => ({
    code: def.code,
    title: def.title,
    description: def.description,
    icon: def.icon,
    earned: earnedMap.has(def.code),
    earnedAt: earnedMap.get(def.code) ?? null,
  }));

  const scoreTrend: SeriesPoint[] = winnerRows
    .slice()
    .sort((a, b) => new Date(a.selected_at).getTime() - new Date(b.selected_at).getTime())
    .map((w) => ({
      label: new Date(w.selected_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: Math.round((w.final_score ?? 0) * 100) / 100,
    }));

  return {
    applicationsSubmitted: applicationRows.length,
    accepted,
    acceptanceRate: pct(accepted, applicationRows.length),
    selected: participantRows.length,
    selectionRate: pct(participantRows.length, applicationRows.length),
    wins: winnerRows.length,
    winRate: pct(winnerRows.length, participantRows.length),
    avgSubmissionHours: submissionHours.length ? avg(submissionHours) : 0,
    rewardsWon: sum(winnerRows.map((w) => w.reward_amount)),
    rewardsPaid: sum(payoutRows.filter((p) => p.status === "paid").map((p) => p.amount)),
    activeContests: (contestRows ?? []).filter((c) => c.status === "live").length,
    completedContests: (contestRows ?? []).filter((c) => c.status === "completed").length,
    avgEngagement: avg(submissionRows.map((s) => s.engagement_rate)),
    scoreTrend,
    applicationsOverTime: dailySeries(
      applicationRows.map((a) => a.created_at),
      days,
    ),
    achievements,
  };
}

/**
 * Recalculate and persist achievements for one influencer. Idempotent — an
 * already-awarded achievement is never duplicated or revoked.
 */
export async function syncInfluencerAchievements(influencerId: string): Promise<string[]> {
  const db = await admin();
  const stats = await fetchInfluencerAnalytics(influencerId);
  const codes: string[] = [];

  if (stats.applicationsSubmitted > 0) codes.push("first_application");
  if (stats.selected > 0) codes.push("first_selection");
  if (stats.wins > 0) codes.push("first_win");
  if (stats.avgSubmissionHours > 0 && stats.avgSubmissionHours <= 48) codes.push("fast_responder");
  if (stats.completedContests >= 5) codes.push("consistent_creator");

  const { data: firstPlace } = await db
    .from("contest_winners")
    .select("id")
    .eq("influencer_id", influencerId)
    .eq("rank", 1)
    .limit(1);
  if ((firstPlace ?? []).length > 0) codes.push("top_performer");

  if (!codes.length) return [];
  await db.from("user_achievements").upsert(
    codes.map((code) => ({ user_id: influencerId, code })),
    { onConflict: "user_id,code", ignoreDuplicates: true },
  );
  return codes;
}

/* -------------------------------- contest ------------------------------- */

export async function fetchContestAnalytics(contestId: string): Promise<ContestAnalytics> {
  const db = await admin();
  const [contest, applications, participants, submissions, winners, payouts] = await Promise.all([
    db
      .from("contests")
      .select(
        "id, title, status, reward_pool, winner_count, participant_limit, created_at, published_at, application_start_date, application_deadline, contest_start_date, contest_end_date",
      )
      .eq("id", contestId)
      .maybeSingle(),
    db.from("contest_applications").select("id, status, created_at").eq("contest_id", contestId),
    db.from("contest_participants").select("id, participation_status").eq("contest_id", contestId),
    db
      .from("contest_submissions")
      .select("id, submission_status, engagement_rate, views")
      .eq("contest_id", contestId),
    db
      .from("contest_winners")
      .select("id, influencer_id, rank, final_score, reward_amount")
      .eq("contest_id", contestId)
      .order("rank"),
    db.from("payouts").select("id, amount, status").eq("contest_id", contestId),
  ]);

  const contestRow = contest.data;
  const applicationRows = applications.data ?? [];
  const participantRows = participants.data ?? [];
  const submissionRows = submissions.data ?? [];
  const winnerRows = winners.data ?? [];
  const payoutRows = payouts.data ?? [];

  const winnerIds = winnerRows.map((w) => w.influencer_id);
  const { data: winnerProfiles } = winnerIds.length
    ? await db.from("profiles").select("id, full_name").in("id", winnerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((winnerProfiles ?? []).map((p) => [p.id, p.full_name ?? "Influencer"]));

  const verified = submissionRows.filter((s) => s.submission_status === "verified").length;
  const flagged = submissionRows.filter((s) => s.submission_status === "flagged").length;
  const pending = submissionRows.filter((s) => s.submission_status === "pending").length;

  return {
    contestId,
    title: contestRow?.title ?? "Contest",
    status: contestRow?.status ?? "draft",
    applicationsOverTime: dailySeries(
      applicationRows.map((a) => a.created_at),
      30,
    ),
    participantFunnel: [
      { label: "Applications", value: applicationRows.length },
      {
        label: "Shortlisted",
        value: applicationRows.filter((a) => a.status === "shortlisted").length,
      },
      { label: "Selected", value: participantRows.length },
      {
        label: "Active",
        value: participantRows.filter((p) => p.participation_status === "active").length,
      },
    ],
    submissionFunnel: [
      { label: "Participants", value: participantRows.length },
      { label: "Submitted", value: submissionRows.length },
      { label: "Verified", value: verified },
      { label: "Winners", value: winnerRows.length },
    ],
    verificationFunnel: [
      { label: "Pending", value: pending },
      { label: "Submitted", value: submissionRows.length - verified - flagged - pending },
      { label: "Verified", value: verified },
      { label: "Flagged", value: flagged },
    ],
    winnerBreakdown: winnerRows.map((w) => ({
      label: nameById.get(w.influencer_id) ?? "Influencer",
      rank: w.rank,
      score: Math.round((w.final_score ?? 0) * 100) / 100,
      reward: w.reward_amount ?? 0,
    })),
    rewardDistribution: winnerRows.map((w) => ({
      label: `#${w.rank} ${nameById.get(w.influencer_id) ?? "Influencer"}`,
      value: w.reward_amount ?? 0,
    })),
    timeline: [
      { label: "Created", date: contestRow?.created_at ?? null },
      { label: "Published", date: contestRow?.published_at ?? null },
      { label: "Applications open", date: contestRow?.application_start_date ?? null },
      { label: "Applications close", date: contestRow?.application_deadline ?? null },
      { label: "Contest start", date: contestRow?.contest_start_date ?? null },
      { label: "Contest end", date: contestRow?.contest_end_date ?? null },
    ],
    totals: {
      applications: applicationRows.length,
      participants: participantRows.length,
      submissions: submissionRows.length,
      verified,
      winners: winnerRows.length,
      rewardAwarded: sum(winnerRows.map((w) => w.reward_amount)),
      rewardPaid: sum(payoutRows.filter((p) => p.status === "paid").map((p) => p.amount)),
      avgEngagement: avg(submissionRows.map((s) => s.engagement_rate)),
    },
  };
}

/* ------------------------------ sub domains ----------------------------- */

export async function fetchCampaignAnalytics(days = 30): Promise<CampaignAnalytics> {
  const db = await admin();
  const { data } = await db
    .from("campaign_requests")
    .select("id, status, created_at, submitted_at, reviewed_at");
  const rows = data ?? [];
  const approved = rows.filter((r) => r.status === "approved").length;
  const reviewHours = rows
    .map((r) =>
      r.submitted_at && r.reviewed_at
        ? (new Date(r.reviewed_at).getTime() - new Date(r.submitted_at).getTime()) /
          (60 * 60 * 1000)
        : null,
    )
    .filter((v): v is number => v !== null);

  return {
    byStatus: toSeries(countBy(rows, "status")),
    overTime: dailySeries(
      rows.map((r) => r.created_at),
      days,
    ),
    approvalRate: pct(approved, rows.length),
    avgReviewHours: reviewHours.length ? avg(reviewHours) : 0,
    total: rows.length,
  };
}

export async function fetchSubmissionAnalytics(days = 30): Promise<SubmissionAnalytics> {
  const db = await admin();
  const { data } = await db
    .from("contest_submissions")
    .select("id, submission_status, engagement_rate, views, created_at");
  const rows = data ?? [];
  return {
    byStatus: toSeries(countBy(rows, "submission_status")),
    overTime: dailySeries(
      rows.map((r) => r.created_at),
      days,
    ),
    avgEngagement: avg(rows.map((r) => r.engagement_rate)),
    totalViews: sum(rows.map((r) => r.views)),
    total: rows.length,
  };
}

export async function fetchWinnerAnalytics(): Promise<WinnerAnalytics> {
  const db = await admin();
  const { data } = await db
    .from("contest_winners")
    .select("id, influencer_id, rank, reward_amount");
  const rows = data ?? [];
  const ids = Array.from(new Set(rows.map((r) => r.influencer_id)));
  const { data: profileRows } = ids.length
    ? await db.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.full_name ?? "Influencer"]));

  const byInfluencer = new Map<string, { wins: number; reward: number }>();
  for (const row of rows) {
    const entry = byInfluencer.get(row.influencer_id) ?? { wins: 0, reward: 0 };
    entry.wins += 1;
    entry.reward += row.reward_amount ?? 0;
    byInfluencer.set(row.influencer_id, entry);
  }

  const rankCounts: Record<string, number> = {};
  for (const row of rows) {
    const key = `Rank ${row.rank}`;
    rankCounts[key] = (rankCounts[key] ?? 0) + 1;
  }

  return {
    byRank: Object.entries(rankCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    topInfluencers: Array.from(byInfluencer.entries())
      .map(([id, v]) => ({ id, name: nameById.get(id) ?? "Influencer", ...v }))
      .sort((a, b) => b.reward - a.reward)
      .slice(0, 8),
    totalReward: sum(rows.map((r) => r.reward_amount)),
    total: rows.length,
  };
}

export async function fetchPayoutAnalytics(days = 30): Promise<PayoutAnalytics> {
  const db = await admin();
  const { data } = await db.from("payouts").select("id, status, amount, created_at");
  const rows = data ?? [];
  return {
    byStatus: toSeries(countBy(rows, "status")),
    overTime: dailySeries(
      rows.map((r) => r.created_at),
      days,
    ),
    totalPaid: sum(rows.filter((r) => r.status === "paid").map((r) => r.amount)),
    totalPending: sum(
      rows
        .filter((r) => r.status !== "paid" && r.status !== "cancelled" && r.status !== "failed")
        .map((r) => r.amount),
    ),
    totalFailed: sum(rows.filter((r) => r.status === "failed").map((r) => r.amount)),
    total: rows.length,
  };
}
