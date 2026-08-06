import { fetchContestById, type Db } from "@/features/contest-applications/application.server";
import { isAdmin } from "@/features/contests/contest.server";
import type { Contest } from "@/features/contests/types";
import {
  isContestEnded,
  type ContestProgress,
  type ContestSubmission,
  type ParticipantSubmission,
  type SubmissionEvent,
  type SubmissionEventType,
  type SubmissionStatus,
} from "./types";

export type { Db };

export type SubmissionRow = {
  id: string;
  contest_id: string;
  participant_id: string;
  influencer_id: string;
  platform: string;
  content_url: string;
  caption: string | null;
  notes: string | null;
  submission_status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export const SUBMISSION_COLUMNS =
  "id, contest_id, participant_id, influencer_id, platform, content_url, caption, notes, submission_status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at";

/** Cross-user reads and writes need the admin client; callers authorize first. */
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Decoration = {
  contestTitle?: string;
  influencerName?: string | null;
  influencerHandle?: string | null;
  portfolioUrl?: string | null;
};

export function toSubmission(row: SubmissionRow, extra: Decoration = {}): ContestSubmission {
  return {
    id: row.id,
    contestId: row.contest_id,
    contestTitle: extra.contestTitle ?? "",
    participantId: row.participant_id,
    influencerId: row.influencer_id,
    influencerName: extra.influencerName ?? null,
    influencerHandle: extra.influencerHandle ?? null,
    portfolioUrl: extra.portfolioUrl ?? null,
    platform: row.platform,
    contentUrl: row.content_url,
    caption: row.caption,
    notes: row.notes,
    status: row.submission_status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchContestOrThrow(db: Db, contestId: string): Promise<Contest> {
  const contest = await fetchContestById(db, contestId);
  if (!contest) throw new Error("Contest not found.");
  return contest;
}

export async function assertAdmin(db: Db, userId: string): Promise<void> {
  if (!(await isAdmin(db, userId))) throw new Error("You do not have access to this submission.");
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

export type ParticipantRecord = {
  id: string;
  influencerId: string;
  applicationId: string;
  participationStatus: string;
};

/** The caller must be an active participant of this contest. */
export async function validateParticipant(
  contestId: string,
  userId: string,
): Promise<ParticipantRecord> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_participants")
    .select("id, influencer_id, application_id, participation_status")
    .eq("contest_id", contestId)
    .eq("influencer_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You are not a participant in this contest.");
  if (data.participation_status !== "active") {
    throw new Error("Your participation in this contest is no longer active.");
  }
  return {
    id: data.id as string,
    influencerId: data.influencer_id as string,
    applicationId: data.application_id as string,
    participationStatus: data.participation_status as string,
  };
}

/** Submissions are only accepted while the contest is live and before it ends. */
export function validateSubmissionWindow(contest: Contest, now: Date = new Date()): void {
  if (contest.status !== "live") {
    throw new Error("Content can only be submitted while the contest is live.");
  }
  if (isContestEnded(contest, now)) {
    throw new Error("This contest has ended and no longer accepts submissions.");
  }
}

export async function checkDuplicateSubmission(participantId: string): Promise<void> {
  const sb = await admin();
  const { count, error } = await sb
    .from("contest_submissions")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) {
    throw new Error("You have already submitted content for this contest.");
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function fetchSubmissionRow(
  contestId: string,
  userId: string,
): Promise<SubmissionRow | null> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("contest_id", contestId)
    .eq("influencer_id", userId)
    .maybeSingle<SubmissionRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function fetchSubmissionById(submissionId: string): Promise<SubmissionRow | null> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("id", submissionId)
    .maybeSingle<SubmissionRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

type InfluencerInfo = {
  name: string | null;
  handle: string | null;
};

async function loadInfluencerInfo(userIds: string[]): Promise<Map<string, InfluencerInfo>> {
  const map = new Map<string, InfluencerInfo>();
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

/** Admin workspace rows: every participant, with a submission when one exists. */
export async function loadParticipantSubmissions(
  contest: Contest,
): Promise<ParticipantSubmission[]> {
  const sb = await admin();
  const [{ data: participants, error }, { data: submissions, error: submissionError }] =
    await Promise.all([
      sb
        .from("contest_participants")
        .select("id, influencer_id, application_id, participation_status")
        .eq("contest_id", contest.id),
      sb.from("contest_submissions").select(SUBMISSION_COLUMNS).eq("contest_id", contest.id),
    ]);
  if (error) throw new Error(error.message);
  if (submissionError) throw new Error(submissionError.message);

  const rows = participants ?? [];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.influencer_id as string))];
  const applicationIds = [...new Set(rows.map((r) => r.application_id as string))];
  const [info, { data: applications }, { data: creators }] = await Promise.all([
    loadInfluencerInfo(userIds),
    sb.from("contest_applications").select("id, portfolio_url").in("id", applicationIds),
    sb.from("creator_profiles").select("user_id, followers, niche").in("user_id", userIds),
  ]);

  const portfolios = new Map(
    (applications ?? []).map((a) => [a.id as string, a.portfolio_url as string | null]),
  );
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id as string, c]));
  const submissionMap = new Map(
    ((submissions ?? []) as SubmissionRow[]).map((s) => [s.participant_id, s]),
  );

  return rows.map((row) => {
    const influencerId = row.influencer_id as string;
    const detail = info.get(influencerId);
    const creator = creatorMap.get(influencerId);
    const portfolioUrl = portfolios.get(row.application_id as string) ?? null;
    const submissionRow = submissionMap.get(row.id as string) ?? null;

    return {
      participantId: row.id as string,
      influencerId,
      influencerName: detail?.name ?? null,
      influencerHandle: detail?.handle ?? null,
      portfolioUrl,
      followers: (creator?.followers as number | null) ?? null,
      niche: (creator?.niche as string | null) ?? null,
      status: submissionRow ? submissionRow.submission_status : "pending",
      submission: submissionRow
        ? toSubmission(submissionRow, {
            contestTitle: contest.title,
            influencerName: detail?.name ?? null,
            influencerHandle: detail?.handle ?? null,
            portfolioUrl,
          })
        : null,
    } satisfies ParticipantSubmission;
  });
}

export async function decorateSubmission(
  contest: Contest,
  row: SubmissionRow,
): Promise<ContestSubmission> {
  const info = await loadInfluencerInfo([row.influencer_id]);
  const sb = await admin();
  const { data: participant } = await sb
    .from("contest_participants")
    .select("application_id")
    .eq("id", row.participant_id)
    .maybeSingle();
  let portfolioUrl: string | null = null;
  if (participant?.application_id) {
    const { data: application } = await sb
      .from("contest_applications")
      .select("portfolio_url")
      .eq("id", participant.application_id as string)
      .maybeSingle();
    portfolioUrl = (application?.portfolio_url as string | null) ?? null;
  }
  const detail = info.get(row.influencer_id);
  return toSubmission(row, {
    contestTitle: contest.title,
    influencerName: detail?.name ?? null,
    influencerHandle: detail?.handle ?? null,
    portfolioUrl,
  });
}

export async function fetchSubmissionEvents(submissionId: string): Promise<SubmissionEvent[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_submission_events")
    .select("id, submission_id, actor_id, event_type, note, created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const actorIds = [...new Set(rows.map((r) => r.actor_id as string | null).filter(Boolean))] as string[];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await sb.from("profiles").select("id, full_name").in("id", actorIds);
    for (const profile of profiles ?? []) {
      names.set(profile.id as string, profile.full_name as string | null);
    }
  }
  return rows.map((row) => ({
    id: row.id as string,
    submissionId: row.submission_id as string,
    eventType: row.event_type as SubmissionEventType,
    actorId: (row.actor_id as string | null) ?? null,
    actorName: row.actor_id ? (names.get(row.actor_id as string) ?? null) : null,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function logSubmissionEvent(input: {
  submissionId: string;
  actorId: string;
  eventType: SubmissionEventType;
  note?: string | null;
}): Promise<void> {
  const sb = await admin();
  const { error } = await sb.from("contest_submission_events").insert({
    submission_id: input.submissionId,
    actor_id: input.actorId,
    event_type: input.eventType,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Aggregate-only progress. Never returns participant identities. */
export async function buildContestProgress(contest: Contest): Promise<ContestProgress> {
  const sb = await admin();
  const [{ count: participantCount, error: participantError }, { data: submissions, error }] =
    await Promise.all([
      sb
        .from("contest_participants")
        .select("id", { count: "exact", head: true })
        .eq("contest_id", contest.id)
        .eq("participation_status", "active"),
      sb
        .from("contest_submissions")
        .select("submission_status, submitted_at")
        .eq("contest_id", contest.id),
    ]);
  if (participantError) throw new Error(participantError.message);
  if (error) throw new Error(error.message);

  const totalParticipants = participantCount ?? 0;
  let verified = 0;
  let flagged = 0;
  let awaitingReview = 0;
  let lastSubmissionAt: string | null = null;
  for (const row of submissions ?? []) {
    const status = row.submission_status as SubmissionStatus;
    if (status === "verified") verified += 1;
    else if (status === "flagged") flagged += 1;
    else awaitingReview += 1;
    const at = row.submitted_at as string;
    if (!lastSubmissionAt || at > lastSubmissionAt) lastSubmissionAt = at;
  }
  const totalSubmitted = (submissions ?? []).length;

  return {
    contestId: contest.id,
    contestStatus: contest.status,
    contestEndDate: contest.contestEndDate,
    hasEnded: isContestEnded(contest),
    totalParticipants,
    totalSubmitted,
    // "Pending" covers participants yet to submit plus submissions awaiting review.
    pendingCount: Math.max(totalParticipants - totalSubmitted, 0) + awaitingReview,
    verifiedCount: verified,
    flaggedCount: flagged,
    submissionRate:
      totalParticipants === 0 ? 0 : Math.round((totalSubmitted / totalParticipants) * 100),
    lastSubmissionAt,
  };
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
  const { createNotifications } = await import("@/features/activity/notification.server");
  await createNotifications(
    rows.map((row) => ({
      userId: row.user_id,
      category: "contest" as const,
      title: row.title,
      body: row.body,
      link: row.link,
      actionLabel: "Open contest",
    })),
  );
}

async function adminUserIds(): Promise<string[]> {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  return (data ?? []).map((row) => row.user_id as string);
}

/** Influencer, business and admins are told when new content arrives. */
export async function notifySubmissionCreated(input: {
  contest: Contest;
  influencerId: string;
  progress: ContestProgress;
}): Promise<void> {
  const rows: NotificationRow[] = [
    {
      user_id: input.influencerId,
      kind: "system",
      title: "Submission received",
      body: `Your content for “${input.contest.title}” has been received and is awaiting review.`,
      link: `/app/contests/${input.contest.id}`,
    },
    {
      user_id: input.contest.businessId,
      kind: "system",
      title: "New submission",
      body: `A participant submitted content for “${input.contest.title}”. ${input.progress.totalSubmitted} of ${input.progress.totalParticipants} participants have now submitted.`,
      link: `/app/business/contests/${input.contest.id}`,
    },
  ];
  for (const id of await adminUserIds()) {
    rows.push({
      user_id: id,
      kind: "system",
      title: "New submission received",
      body: `“${input.contest.title}” has a new content submission awaiting review.`,
      link: `/app/admin/contests/${input.contest.id}`,
    });
  }
  await insertNotifications(rows);
}

export async function notifySubmissionReviewed(input: {
  contest: Contest;
  influencerId: string;
  status: "verified" | "flagged";
  note?: string | null;
}): Promise<void> {
  const verified = input.status === "verified";
  await insertNotifications([
    {
      user_id: input.influencerId,
      kind: "system",
      title: verified ? "Submission verified" : "Submission flagged",
      body: verified
        ? `Your submission for “${input.contest.title}” has been verified.`
        : `Your submission for “${input.contest.title}” was flagged for review.${
            input.note ? ` ${input.note}` : ""
          }`,
      link: `/app/contests/${input.contest.id}`,
    },
    {
      user_id: input.contest.businessId,
      kind: "system",
      title: "Contest progress updated",
      body: `A submission for “${input.contest.title}” was ${verified ? "verified" : "flagged"}.`,
      link: `/app/business/contests/${input.contest.id}`,
    },
  ]);
}

/** Admin review decision: updates status, logs the event and notifies. */
export async function reviewSubmission(
  db: Db,
  userId: string,
  submissionId: string,
  status: "verified" | "flagged",
  note?: string,
): Promise<ContestSubmission> {
  await assertAdmin(db, userId);
  const existing = await fetchSubmissionById(submissionId);
  if (!existing) throw new Error("Submission not found.");
  const contest = await fetchContestOrThrow(db, existing.contest_id);

  const sb = await admin();
  const { data: row, error } = await sb
    .from("contest_submissions")
    .update({
      submission_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", submissionId)
    .select(SUBMISSION_COLUMNS)
    .single<SubmissionRow>();
  if (error) throw new Error(error.message);

  await logSubmissionEvent({
    submissionId: row.id,
    actorId: userId,
    eventType: status === "verified" ? "submission_verified" : "submission_flagged",
    note: note?.trim() || null,
  });
  await notifySubmissionReviewed({
    contest,
    influencerId: row.influencer_id,
    status,
    note: note?.trim() || null,
  });

  return decorateSubmission(contest, row);
}
