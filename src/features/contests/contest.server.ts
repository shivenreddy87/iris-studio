import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  CONTEST_TRANSITIONS,
  STATUS_EVENT,
  type Contest,
  type ContestEvent,
  type ContestEventType,
  type ContestStatus,
} from "./types";
import type { ContestFormValues } from "./contest.schema";

export type Db = SupabaseClient<Database>;

export type ContestRow = {
  id: string;
  campaign_request_id: string;
  business_id: string;
  title: string;
  description: string | null;
  campaign_goal: string | null;
  business_category: string | null;
  target_platform: string | null;
  target_location: string | null;
  required_views: number | null;
  reward_pool: number | string | null;
  participant_limit: number | null;
  winner_count: number | null;
  preferred_creator_category: string | null;
  minimum_followers: number | null;
  maximum_followers: number | null;
  application_start_date: string | null;
  application_deadline: string | null;
  contest_start_date: string | null;
  contest_end_date: string | null;
  contest_brief: string | null;
  contest_rules: string | null;
  attachment_url: string | null;
  status: ContestStatus;
  published_at: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const CONTEST_COLUMNS =
  "id, campaign_request_id, business_id, title, description, campaign_goal, business_category, target_platform, target_location, required_views, reward_pool, participant_limit, winner_count, preferred_creator_category, minimum_followers, maximum_followers, application_start_date, application_deadline, contest_start_date, contest_end_date, contest_brief, contest_rules, attachment_url, status, published_at, archived_at, created_by, created_at, updated_at";

export function toContest(
  row: ContestRow,
  extra: { businessName?: string | null; approvalReference?: string | null } = {},
): Contest {
  return {
    id: row.id,
    campaignRequestId: row.campaign_request_id,
    approvalReference: extra.approvalReference ?? null,
    businessId: row.business_id,
    businessName: extra.businessName ?? null,
    title: row.title,
    description: row.description,
    campaignGoal: row.campaign_goal,
    businessCategory: row.business_category,
    targetPlatform: row.target_platform,
    targetLocation: row.target_location,
    requiredViews: row.required_views,
    rewardPool: row.reward_pool === null ? null : Number(row.reward_pool),
    participantLimit: row.participant_limit,
    winnerCount: row.winner_count,
    preferredCreatorCategory: row.preferred_creator_category,
    minimumFollowers: row.minimum_followers,
    maximumFollowers: row.maximum_followers,
    applicationStartDate: row.application_start_date,
    applicationDeadline: row.application_deadline,
    contestStartDate: row.contest_start_date,
    contestEndDate: row.contest_end_date,
    contestBrief: row.contest_brief,
    contestRules: row.contest_rules,
    attachmentUrl: row.attachment_url,
    status: row.status,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const text = (s?: string | null) => (s && s.trim() !== "" ? s.trim() : null);
const num = (n?: number | null) => (typeof n === "number" && Number.isFinite(n) ? n : null);
const date = (s?: string | null) => (s && s.trim() !== "" ? s.trim() : null);

/** Operational fields an admin may edit at any point before archiving. */
export function toOperationalPayload(v: ContestFormValues) {
  return {
    reward_pool: num(v.rewardPool),
    participant_limit: num(v.participantLimit),
    winner_count: num(v.winnerCount),
    application_start_date: date(v.applicationStartDate),
    application_deadline: date(v.applicationDeadline),
    contest_start_date: date(v.contestStartDate),
    contest_end_date: date(v.contestEndDate),
    contest_brief: text(v.contestBrief),
    contest_rules: text(v.contestRules),
  };
}

/** Inherited campaign fields — only writable while the contest is a Draft. */
export function toInheritedPayload(v: ContestFormValues) {
  return {
    title: v.title.trim(),
    description: text(v.description),
    campaign_goal: text(v.campaignGoal),
    business_category: text(v.businessCategory),
    target_platform: text(v.targetPlatform),
    target_location: text(v.targetLocation),
    required_views: num(v.requiredViews),
    preferred_creator_category: text(v.preferredCreatorCategory),
    minimum_followers: num(v.minimumFollowers),
    maximum_followers: num(v.maximumFollowers),
    attachment_url: text(v.attachmentUrl),
  };
}

export async function isAdmin(db: Db, userId: string): Promise<boolean> {
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export async function assertAdmin(db: Db, userId: string): Promise<void> {
  if (!(await isAdmin(db, userId))) throw new Error("Forbidden");
}

export async function logContestEvent(
  db: Db,
  input: { contestId: string; actorId: string; eventType: ContestEventType; note?: string | null },
): Promise<void> {
  const { error } = await db.from("contest_events").insert({
    contest_id: input.contestId,
    actor_id: input.actorId,
    event_type: input.eventType,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export function assertTransition(from: ContestStatus, to: ContestStatus): void {
  if (!CONTEST_TRANSITIONS[from].includes(to)) {
    throw new Error(`A contest cannot move from ${from} to ${to}.`);
  }
}

/** Moves a contest to the next status and always records the matching event. */
export async function applyContestTransition(
  db: Db,
  input: { contestId: string; actorId: string; to: ContestStatus; note?: string | null },
): Promise<Contest> {
  const { data: current, error: readError } = await db
    .from("contests")
    .select("status")
    .eq("id", input.contestId)
    .maybeSingle<{ status: ContestStatus }>();
  if (readError) throw new Error(readError.message);
  if (!current) throw new Error("Contest not found.");
  assertTransition(current.status, input.to);

  const patch: { status: ContestStatus; published_at?: string; archived_at?: string } = {
    status: input.to,
  };
  if (input.to === "published") patch.published_at = new Date().toISOString();
  if (input.to === "archived") patch.archived_at = new Date().toISOString();

  const { data: row, error } = await db
    .from("contests")
    .update(patch)
    .eq("id", input.contestId)
    .eq("status", current.status)
    .select(CONTEST_COLUMNS)
    .maybeSingle<ContestRow>();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("This contest is no longer in a state that allows that action.");

  await logContestEvent(db, {
    contestId: row.id,
    actorId: input.actorId,
    eventType: STATUS_EVENT[input.to],
    ...(input.note ? { note: input.note } : {}),
  });

  return toContest(row);
}

export async function decorate(db: Db, rows: ContestRow[]): Promise<Contest[]> {
  if (rows.length === 0) return [];
  const [{ data: profiles }, { data: requests }] = await Promise.all([
    db
      .from("business_profiles")
      .select("user_id, business_name")
      .in("user_id", [...new Set(rows.map((r) => r.business_id))]),
    db
      .from("campaign_requests")
      .select("id, approval_reference")
      .in("id", [...new Set(rows.map((r) => r.campaign_request_id))]),
  ]);
  const names = new Map((profiles ?? []).map((p) => [p.user_id, p.business_name]));
  const refs = new Map((requests ?? []).map((r) => [r.id, r.approval_reference]));
  return rows.map((row) =>
    toContest(row, {
      businessName: names.get(row.business_id) ?? null,
      approvalReference: refs.get(row.campaign_request_id) ?? null,
    }),
  );
}

type EventRow = {
  id: string;
  contest_id: string;
  actor_id: string | null;
  event_type: string;
  note: string | null;
  created_at: string;
};

export async function fetchContestEvents(db: Db, contestId: string): Promise<ContestEvent[]> {
  const { data, error } = await db
    .from("contest_events")
    .select("id, contest_id, actor_id, event_type, note, created_at")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true })
    .returns<EventRow[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v)))];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await db.from("profiles").select("id, full_name").in("id", actorIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name);
  }

  return rows.map((row) => ({
    id: row.id,
    contestId: row.contest_id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
    eventType: row.event_type as ContestEventType,
    note: row.note,
    createdAt: row.created_at,
  }));
}

const NOTIFICATION_COPY: Partial<Record<ContestStatus, { title: string; body: (t: string) => string }>> =
  {
    draft: {
      title: "Contest draft created",
      body: (t) => `A contest is being prepared from your approved request "${t}".`,
    },
    published: {
      title: "Contest published",
      body: (t) => `Your contest "${t}" is now published.`,
    },
    archived: {
      title: "Contest archived",
      body: (t) => `Your contest "${t}" has been archived.`,
    },
  };

/** In-app notification for the owning business (cross-user write needs admin access). */
export async function notifyBusinessOfContest(input: {
  businessId: string;
  contestId: string;
  contestTitle: string;
  status: ContestStatus;
}): Promise<void> {
  const copy = NOTIFICATION_COPY[input.status];
  if (!copy) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert({
    user_id: input.businessId,
    kind: "system",
    title: copy.title,
    body: copy.body(input.contestTitle),
    link: `/app/business/contests/${input.contestId}`,
  });
}
