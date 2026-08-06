import { isAdmin, logContestEvent } from "@/features/contests/contest.server";
import type { Contest } from "@/features/contests/types";
import {
  APPLICATION_COLUMNS,
  decorateApplications,
  fetchContestById,
  logApplicationEvent,
  type ApplicationRow,
  type Db,
} from "./application.server";
import {
  canTransitionApplication,
  type ApplicationStatus,
  type ContestApplication,
  type ContestParticipant,
  type ParticipationStatus,
  type SelectionSummaryData,
} from "./types";

/** Contest states in which admins may move applications through selection. */
export const SELECTION_CONTEST_STATUSES = ["applications_closed", "participant_selection"] as const;

export type ParticipantRow = {
  id: string;
  contest_id: string;
  application_id: string;
  influencer_id: string;
  selected_at: string;
  activated_at: string | null;
  participation_status: ParticipationStatus;
  created_at: string;
};

export const PARTICIPANT_COLUMNS =
  "id, contest_id, application_id, influencer_id, selected_at, activated_at, participation_status, created_at";

export async function assertSelectionAdmin(db: Db, userId: string): Promise<void> {
  if (!(await isAdmin(db, userId))) throw new Error("You do not have access to this contest.");
}

export function canRunSelection(contest: Contest): boolean {
  return (
    contest.status !== "archived" &&
    (SELECTION_CONTEST_STATUSES as readonly string[]).includes(contest.status)
  );
}

export function assertSelectionWindow(contest: Contest): void {
  if (contest.status === "archived") throw new Error("This contest has been archived.");
  if (!canRunSelection(contest)) {
    throw new Error(
      "Participants can only be managed once applications are closed and before the contest goes live.",
    );
  }
}

/** Cross-user reads/writes need the admin client; callers must authorize first. */
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function fetchApplicationRow(
  db: Db,
  applicationId: string,
): Promise<ApplicationRow | null> {
  const { data, error } = await db
    .from("contest_applications")
    .select(APPLICATION_COLUMNS)
    .eq("id", applicationId)
    .maybeSingle<ApplicationRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function countSelected(contestId: string): Promise<number> {
  const sb = await admin();
  const { count, error } = await sb
    .from("contest_applications")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contestId)
    .eq("status", "selected");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function assertWithinLimit(contest: Contest, selectedCount: number, adding: number): void {
  const limit = contest.participantLimit;
  if (limit === null) return;
  if (selectedCount + adding > limit) {
    throw new Error(
      `This contest allows ${limit} participant${limit === 1 ? "" : "s"} and ${selectedCount} ${
        selectedCount === 1 ? "has" : "have"
      } already been selected.`,
    );
  }
}

export function assertTransitionAllowed(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransitionApplication(from, to)) {
    throw new Error(`An application cannot move from ${from} to ${to}.`);
  }
}

/**
 * Applies one status transition, records the application event, and keeps the
 * participant record in sync. Returns the decorated application.
 */
export async function applySelectionTransition(
  db: Db,
  input: {
    contest: Contest;
    applicationId: string;
    to: ApplicationStatus;
    actorId: string;
    note?: string | null;
  },
): Promise<ContestApplication> {
  const existing = await fetchApplicationRow(db, input.applicationId);
  if (!existing) throw new Error("Application not found.");
  if (existing.contest_id !== input.contest.id) throw new Error("Application not found.");
  assertTransitionAllowed(existing.status, input.to);

  const sb = await admin();
  const { data: row, error } = await sb
    .from("contest_applications")
    .update({ status: input.to })
    .eq("id", input.applicationId)
    .eq("status", existing.status)
    .select(APPLICATION_COLUMNS)
    .maybeSingle<ApplicationRow>();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("This application changed while you were reviewing it.");

  if (input.to === "selected") {
    const { error: participantError } = await sb.from("contest_participants").insert({
      contest_id: input.contest.id,
      application_id: row.id,
      influencer_id: row.influencer_id,
      participation_status: "active",
    });
    if (participantError && participantError.code !== "23505") {
      throw new Error(participantError.message);
    }
  }

  await logApplicationEvent(db, {
    applicationId: row.id,
    actorId: input.actorId,
    eventType:
      input.to === "shortlisted"
        ? "shortlisted"
        : input.to === "selected"
          ? "selected"
          : "rejected",
    ...(input.note ? { note: input.note } : {}),
  });

  const [application] = await decorateApplications(db, [row], { withApplicants: true });
  if (!application) throw new Error("Could not load the application.");
  return application;
}

/** First selection moves the contest into Participant Selection exactly once. */
export async function ensureSelectionStarted(
  db: Db,
  contest: Contest,
  actorId: string,
): Promise<void> {
  if (contest.status !== "applications_closed") return;
  const sb = await admin();
  const { data, error } = await sb
    .from("contests")
    .update({ status: "participant_selection" })
    .eq("id", contest.id)
    .eq("status", "applications_closed")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  await logContestEvent(db, {
    contestId: contest.id,
    actorId,
    eventType: "participant_selection_started",
  });
}

export async function fetchParticipants(contestId: string): Promise<ContestParticipant[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_participants")
    .select(PARTICIPANT_COLUMNS)
    .eq("contest_id", contestId)
    .order("selected_at", { ascending: true })
    .returns<ParticipantRow[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.influencer_id))];
  const [{ data: profiles }, { data: creators }, { data: applications }] = await Promise.all([
    sb.from("profiles").select("id, full_name").in("id", userIds),
    sb
      .from("creator_profiles")
      .select("user_id, display_name, handle, followers, niche")
      .in("user_id", userIds),
    sb
      .from("contest_applications")
      .select("id, portfolio_url")
      .in(
        "id",
        rows.map((r) => r.application_id),
      ),
  ]);

  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c]));
  const portfolios = new Map((applications ?? []).map((a) => [a.id, a.portfolio_url as string]));

  return rows.map((row) => {
    const creator = creatorMap.get(row.influencer_id);
    return {
      id: row.id,
      contestId: row.contest_id,
      applicationId: row.application_id,
      influencerId: row.influencer_id,
      influencerName: creator?.display_name ?? names.get(row.influencer_id) ?? null,
      influencerHandle: creator?.handle ?? null,
      followers: creator?.followers ?? null,
      niche: creator?.niche ?? null,
      portfolioUrl: portfolios.get(row.application_id) ?? null,
      selectedAt: row.selected_at,
      activatedAt: row.activated_at,
      participationStatus: row.participation_status,
      createdAt: row.created_at,
    } satisfies ContestParticipant;
  });
}

export async function buildSelectionSummary(
  db: Db,
  contest: Contest,
): Promise<SelectionSummaryData> {
  const sb = await admin();
  const [{ data: statuses, error }, participants] = await Promise.all([
    sb.from("contest_applications").select("status").eq("contest_id", contest.id),
    fetchParticipants(contest.id),
  ]);
  if (error) throw new Error(error.message);
  void db;

  let total = 0;
  let selected = 0;
  let shortlisted = 0;
  let rejected = 0;
  for (const row of statuses ?? []) {
    total += 1;
    if (row.status === "selected") selected += 1;
    if (row.status === "shortlisted") shortlisted += 1;
    if (row.status === "rejected") rejected += 1;
  }

  const limit = contest.participantLimit;
  const remaining = limit === null ? null : Math.max(limit - selected, 0);
  const activatedAt = participants.find((p) => p.activatedAt)?.activatedAt ?? null;

  return {
    contestId: contest.id,
    contestStatus: contest.status,
    participantLimit: limit,
    totalApplications: total,
    selectedCount: selected,
    shortlistedCount: shortlisted,
    rejectedCount: rejected,
    remainingSlots: remaining,
    canSelect: canRunSelection(contest) && (remaining === null || remaining > 0),
    canActivate: contest.status === "participant_selection" && selected > 0,
    activatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function notifyInfluencerDecision(input: {
  status: Extract<ApplicationStatus, "shortlisted" | "selected" | "rejected">;
  influencerId: string;
  applicationId: string;
  contestId: string;
  contestTitle: string;
}): Promise<void> {
  const copy: Record<typeof input.status, { title: string; body: string }> = {
    shortlisted: {
      title: "You have been shortlisted",
      body: `Your application for “${input.contestTitle}” has been shortlisted.`,
    },
    selected: {
      title: "You have been selected",
      body: `You have been selected as a participant for “${input.contestTitle}”.`,
    },
    rejected: {
      title: "Application not selected",
      body: `You were not selected for “${input.contestTitle}” this time. Keep an eye out for new contests.`,
    },
  };
  const { createNotification, createActivity } =
    await import("@/features/activity/notification.server");
  await createActivity({
    targetUserId: input.influencerId,
    action: `application.${input.status}`,
    entityType: "contest_application",
    entityId: input.applicationId,
    summary: `${copy[input.status].title} for "${input.contestTitle}".`,
    metadata: { contestId: input.contestId, contestTitle: input.contestTitle },
  });
  await createNotification({
    userId: input.influencerId,
    category: "contest",
    priority: input.status === "selected" ? "high" : "normal",
    title: copy[input.status].title,
    body: copy[input.status].body,
    link: `/app/entries/${input.applicationId}`,
    actionLabel: "View application",
    metadata: { contestId: input.contestId },
  });
}

export async function notifyContestActivated(input: {
  contestId: string;
  contestTitle: string;
  businessId: string;
  participantIds: string[];
  actorId: string;
  participantCount: number;
}): Promise<void> {
  const { createNotifications, createActivity, notifyAdmins } =
    await import("@/features/activity/notification.server");

  await createActivity({
    actorId: input.actorId,
    targetUserId: input.businessId,
    action: "contest.activated",
    entityType: "contest",
    entityId: input.contestId,
    summary: `“${input.contestTitle}” was activated with ${input.participantCount} participant${
      input.participantCount === 1 ? "" : "s"
    }.`,
    metadata: { contestTitle: input.contestTitle, participantCount: input.participantCount },
  });

  await createNotifications([
    ...input.participantIds.map((influencerId) => ({
      userId: influencerId,
      category: "contest" as const,
      priority: "high" as const,
      title: "Contest is live",
      body: `“${input.contestTitle}” has started. You can find it under Active Contests.`,
      link: `/app/contests/${input.contestId}`,
      actionLabel: "Submit content",
      metadata: { contestId: input.contestId },
    })),
    {
      userId: input.businessId,
      category: "contest" as const,
      title: "Contest activated",
      body: `“${input.contestTitle}” is now live with ${input.participantCount} participant${
        input.participantCount === 1 ? "" : "s"
      }.`,
      link: `/app/business/contests/${input.contestId}`,
      actionLabel: "View contest",
      metadata: { contestId: input.contestId },
    },
  ]);

  await notifyAdmins({
    category: "contest",
    title: "Participant selection completed",
    body: `“${input.contestTitle}” was activated with ${input.participantCount} participant${
      input.participantCount === 1 ? "" : "s"
    }.`,
    link: `/app/admin/contests/${input.contestId}`,
    actionLabel: "Open contest",
    metadata: { contestId: input.contestId },
  });
}

/** Marks every selected participant active and stamps the activation time. */
export async function activateParticipants(contestId: string): Promise<string[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("contest_participants")
    .update({ activated_at: new Date().toISOString(), participation_status: "active" })
    .eq("contest_id", contestId)
    .is("activated_at", null)
    .select("influencer_id");
  if (error) throw new Error(error.message);
  const activated = (data ?? []).map((r) => r.influencer_id as string);
  if (activated.length > 0) return activated;

  const { data: existing } = await sb
    .from("contest_participants")
    .select("influencer_id")
    .eq("contest_id", contestId);
  return (existing ?? []).map((r) => r.influencer_id as string);
}

export async function fetchContestOrThrow(db: Db, contestId: string): Promise<Contest> {
  const contest = await fetchContestById(db, contestId);
  if (!contest) throw new Error("Contest not found.");
  return contest;
}
