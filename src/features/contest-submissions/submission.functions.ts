import { createServerFn } from "@tanstack/react-start";
import { recordAuditLog } from "@/lib/audit.server";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTEST_COLUMNS, decorate, type ContestRow } from "@/features/contests/contest.server";
import type { Contest } from "@/features/contests/types";
import {
  assertAdmin,
  buildContestProgress,
  checkDuplicateSubmission,
  decorateSubmission,
  fetchContestOrThrow,
  fetchSubmissionById,
  fetchSubmissionEvents,
  fetchSubmissionRow,
  loadParticipantSubmissions,
  logSubmissionEvent,
  notifySubmissionCreated,
  reviewSubmission,
  toSubmission,
  validateParticipant,
  validateSubmissionWindow,
  type SubmissionRow,
} from "./submission.server";
import { reviewInputSchema, submissionInputSchema } from "./submission.schema";
import {
  isContestEnded,
  type ContestExecution,
  type ContestProgress,
  type ContestSubmission,
  type ParticipantSubmission,
  type SubmissionEvent,
} from "./types";

/** Influencer: submit content once for a live contest they participate in. */
export const submitContestContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submissionInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestSubmission> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    validateSubmissionWindow(contest);
    const participant = await validateParticipant(contest.id, userId);
    await checkDuplicateSubmission(participant.id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("contest_submissions")
      .insert({
        contest_id: contest.id,
        participant_id: participant.id,
        influencer_id: userId,
        platform: data.platform,
        content_url: data.contentUrl,
        caption: data.caption?.trim() || null,
        notes: data.notes?.trim() || null,
        submission_status: "submitted",
      })
      .select(
        "id, contest_id, participant_id, influencer_id, platform, content_url, caption, notes, submission_status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
      )
      .single<SubmissionRow>();
    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already submitted content for this contest.");
      }
      throw new Error(error.message);
    }

    await logSubmissionEvent({
      submissionId: row.id,
      actorId: userId,
      eventType: "submission_created",
    });

    const progress = await buildContestProgress(contest);
    await notifySubmissionCreated({ contest, influencerId: userId, progress });
    await recordAuditLog({
      actorId: userId,
      actorRole: "influencer",
      entityType: "contest_submission",
      entityId: row.id,
      action: "submit",
      newValues: { contestId: contest.id, platform: data.platform, contentUrl: data.contentUrl },
    });

    return decorateSubmission(contest, row);
  });

/** Influencer: their own submission for a contest, if any. */
export const getMySubmission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestSubmission | null> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    const row = await fetchSubmissionRow(contest.id, userId);
    return row ? decorateSubmission(contest, row) : null;
  });

/** Owner or admin: one submission with its applicant context. */
export const getSubmission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { submissionId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestSubmission> => {
    const { supabase, userId } = context;
    const row = await fetchSubmissionById(data.submissionId);
    if (!row) throw new Error("Submission not found.");
    const contest = await fetchContestOrThrow(supabase, row.contest_id);
    if (row.influencer_id !== userId) await assertAdmin(supabase, userId);
    return decorateSubmission(contest, row);
  });

/** Admin: every participant of a contest with their submission state. */
export const listContestSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ParticipantSubmission[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    return loadParticipantSubmissions(contest);
  });

/** Owner or admin: submission history, sourced only from submission events. */
export const listSubmissionEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { submissionId: string }) => data)
  .handler(async ({ data, context }): Promise<SubmissionEvent[]> => {
    const { supabase, userId } = context;
    const row = await fetchSubmissionById(data.submissionId);
    if (!row) return [];
    if (row.influencer_id !== userId) await assertAdmin(supabase, userId);
    return fetchSubmissionEvents(row.id);
  });

/** Admin: mark a submission verified. */
export const verifySubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestSubmission> => {
    await assertNotSuspended(context.userId);
    return reviewSubmission(
      context.supabase,
      context.userId,
      data.submissionId,
      "verified",
      data.note,
    );
  });

/** Admin: flag a submission for follow-up. */
export const flagSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestSubmission> => {
    await assertNotSuspended(context.userId);
    return reviewSubmission(
      context.supabase,
      context.userId,
      data.submissionId,
      "flagged",
      data.note,
    );
  });

/** Contest owner or admin: aggregate execution progress, no identities. */
export const getContestProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestProgress> => {

    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    if (contest.businessId !== userId) await assertAdmin(supabase, userId);
    return buildContestProgress(contest);
  });

/** Influencer: everything needed to execute a single contest. */
export const getContestExecution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestExecution> => {
    const { supabase, userId } = context;
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: participant } = await supabaseAdmin
      .from("contest_participants")
      .select("id, participation_status")
      .eq("contest_id", contest.id)
      .eq("influencer_id", userId)
      .maybeSingle();

    const row = participant ? await fetchSubmissionRow(contest.id, userId) : null;
    const submission = row ? await decorateSubmission(contest, row) : null;
    const hasEnded = isContestEnded(contest);

    let blockedReason: string | null = null;
    if (!participant) blockedReason = "You are not a participant in this contest.";
    else if (participant.participation_status !== "active") {
      blockedReason = "Your participation in this contest is no longer active.";
    } else if (submission) blockedReason = "Your submission is final and cannot be changed.";
    else if (contest.status !== "live") {
      blockedReason = "Content can only be submitted while the contest is live.";
    } else if (hasEnded) blockedReason = "This contest has ended.";

    return {
      contest,
      participantId: (participant?.id as string | undefined) ?? null,
      submission,
      submissionStatus: submission ? submission.status : "pending",
      hasEnded,
      canSubmit: blockedReason === null,
      blockedReason,
    };
  });

type ExecutionScope = "active" | "completed";

/** Influencer: contests they participate in, split by whether the run has ended. */
export const listMyContestExecutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { scope: ExecutionScope }) => data)
  .handler(async ({ data, context }): Promise<ContestExecution[]> => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: participants, error: participantError } = await supabaseAdmin
      .from("contest_participants")
      .select("id, contest_id, participation_status")
      .eq("influencer_id", userId);
    if (participantError) throw new Error(participantError.message);

    const rows = participants ?? [];
    if (rows.length === 0) return [];
    const contestIds = [...new Set(rows.map((r) => r.contest_id as string))];

    const { data: contestRows, error } = await supabaseAdmin
      .from("contests")
      .select(CONTEST_COLUMNS)
      .in("id", contestIds)
      .in("status", ["live", "completed", "archived"])
      .returns<ContestRow[]>();
    if (error) throw new Error(error.message);

    const contests: Contest[] = await decorate(supabase, contestRows ?? []);
    const { data: submissionRows } = await supabaseAdmin
      .from("contest_submissions")
      .select(
        "id, contest_id, participant_id, influencer_id, platform, content_url, caption, notes, submission_status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
      )
      .eq("influencer_id", userId)
      .in("contest_id", contestIds);
    const submissionMap = new Map(
      ((submissionRows ?? []) as SubmissionRow[]).map((s) => [s.contest_id, s]),
    );
    const participantMap = new Map(rows.map((r) => [r.contest_id as string, r]));

    const executions: ContestExecution[] = [];
    for (const contest of contests) {
      const hasEnded = isContestEnded(contest);
      if (data.scope === "active" && hasEnded) continue;
      if (data.scope === "completed" && !hasEnded) continue;

      const participant = participantMap.get(contest.id);
      const row = submissionMap.get(contest.id) ?? null;
      const submission = row ? toSubmission(row, { contestTitle: contest.title }) : null;

      executions.push({
        contest,
        participantId: (participant?.id as string | undefined) ?? null,
        submission,
        submissionStatus: submission ? submission.status : "pending",
        hasEnded,
        canSubmit:
          !submission &&
          !hasEnded &&
          contest.status === "live" &&
          participant?.participation_status === "active",
        blockedReason: null,
      });
    }

    return executions.sort((a, b) =>
      (a.contest.contestEndDate ?? "").localeCompare(b.contest.contestEndDate ?? ""),
    );
  });
