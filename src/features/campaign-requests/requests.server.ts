import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  CampaignRequest,
  CampaignRequestEvent,
  CampaignRequestStatus,
  RequestEventKind,
} from "./types";

export type Db = SupabaseClient<Database>;

export type Row = {
  id: string;
  business_id: string;
  title: string;
  campaign_goal: string | null;
  business_category: string | null;
  target_audience: string | null;
  target_platform: string | null;
  target_location: string | null;
  required_views: number | null;
  budget: number | string | null;
  duration_days: number | null;
  preferred_creator_category: string | null;
  minimum_followers: number | null;
  maximum_followers: number | null;
  campaign_description: string | null;
  attachment_url: string | null;
  status: CampaignRequestStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  review_reason: string | null;
  approval_reference: string | null;
  created_at: string;
  updated_at: string;
};

export const COLUMNS =
  "id, business_id, title, campaign_goal, business_category, target_audience, target_platform, target_location, required_views, budget, duration_days, preferred_creator_category, minimum_followers, maximum_followers, campaign_description, attachment_url, status, submitted_at, reviewed_at, reviewed_by, review_notes, review_reason, approval_reference, created_at, updated_at";

type ToModelOptions = {
  businessName?: string | null;
  /** Internal admin notes are stripped unless the reader is an admin. */
  includeInternal?: boolean;
};

export function toModel(row: Row, options: ToModelOptions = {}): CampaignRequest {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: options.businessName ?? null,
    title: row.title,
    campaignGoal: row.campaign_goal,
    businessCategory: row.business_category,
    targetAudience: row.target_audience,
    targetPlatform: row.target_platform,
    targetLocation: row.target_location,
    requiredViews: row.required_views,
    budget: row.budget === null ? null : Number(row.budget),
    durationDays: row.duration_days,
    preferredCreatorCategory: row.preferred_creator_category,
    minimumFollowers: row.minimum_followers,
    maximumFollowers: row.maximum_followers,
    campaignDescription: row.campaign_description,
    attachmentUrl: row.attachment_url,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNotes: options.includeInternal ? row.review_notes : null,
    reviewReason: row.review_reason,
    reviewedBy: row.reviewed_by,
    approvalReference: row.approval_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type Payload = {
  title: string;
  campaign_goal: string | null;
  business_category: string | null;
  target_audience: string | null;
  target_platform: string | null;
  target_location: string | null;
  required_views: number | null;
  budget: number | null;
  duration_days: number | null;
  preferred_creator_category: string | null;
  minimum_followers: number | null;
  maximum_followers: number | null;
  campaign_description: string | null;
  attachment_url: string | null;
};

export function toPayload(v: {
  title: string;
  campaignGoal?: string | undefined;
  businessCategory?: string | undefined;
  targetAudience?: string | undefined;
  targetPlatform?: string | undefined;
  targetLocation?: string | undefined;
  requiredViews?: number | undefined;
  budget?: number | undefined;
  durationDays?: number | undefined;
  preferredCreatorCategory?: string | undefined;
  minimumFollowers?: number | undefined;
  maximumFollowers?: number | undefined;
  campaignDescription?: string | undefined;
  attachmentUrl?: string | undefined;
}): Payload {
  const text = (s?: string) => (s && s.trim() !== "" ? s.trim() : null);
  const num = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? n : null);
  return {
    title: v.title.trim(),
    campaign_goal: text(v.campaignGoal),
    business_category: text(v.businessCategory),
    target_audience: text(v.targetAudience),
    target_platform: text(v.targetPlatform),
    target_location: text(v.targetLocation),
    required_views: num(v.requiredViews),
    budget: num(v.budget),
    duration_days: num(v.durationDays),
    preferred_creator_category: text(v.preferredCreatorCategory),
    minimum_followers: num(v.minimumFollowers),
    maximum_followers: num(v.maximumFollowers),
    campaign_description: text(v.campaignDescription),
    attachment_url: text(v.attachmentUrl),
  };
}

/** Role check performed with the caller's own credentials (RLS applies). */
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

export async function logRequestEvent(
  db: Db,
  input: {
    requestId: string;
    actorId: string;
    kind: RequestEventKind;
    note?: string | null;
    internal?: boolean;
  },
): Promise<void> {
  await db.from("campaign_request_events").insert({
    request_id: input.requestId,
    actor_id: input.actorId,
    kind: input.kind,
    note: input.note ?? null,
    internal: input.internal ?? false,
  });
}

export async function listRequestsForAdmin(
  db: Db,
  options: { statuses?: CampaignRequestStatus[]; ascending?: boolean } = {},
): Promise<CampaignRequest[]> {
  let query = db.from("campaign_requests").select(COLUMNS);
  query = options.statuses
    ? query.in("status", options.statuses)
    : query.neq("status", "draft");

  const { data, error } = await query
    .order("created_at", { ascending: options.ascending ?? false })
    .returns<Row[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: profiles } = await db
    .from("business_profiles")
    .select("user_id, business_name")
    .in("user_id", [...new Set(rows.map((r) => r.business_id))]);
  const names = new Map((profiles ?? []).map((p) => [p.user_id, p.business_name]));
  return rows.map((row) =>
    toModel(row, { businessName: names.get(row.business_id) ?? null, includeInternal: true }),
  );
}

type EventRow = {
  id: string;
  request_id: string;
  actor_id: string | null;
  kind: string;
  note: string | null;
  internal: boolean;
  created_at: string;
};

export async function fetchRequestEvents(
  db: Db,
  requestId: string,
  includeInternal: boolean,
): Promise<CampaignRequestEvent[]> {
  const { data, error } = await db
    .from("campaign_request_events")
    .select("id, request_id, actor_id, kind, note, internal, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .returns<EventRow[]>();
  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((row) => includeInternal || !row.internal);
  if (rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v)))];
  const namesById = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) namesById.set(p.id, p.full_name);
  }

  return rows.map((row) => ({
    id: row.id,
    requestId: row.request_id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (namesById.get(row.actor_id) ?? null) : null,
    kind: row.kind as RequestEventKind,
    note: row.note,
    internal: row.internal,
    createdAt: row.created_at,
  }));
}

/** Applies a review decision, enforcing the allowed source status server-side. */
export async function applyReviewTransition(
  db: Db,
  input: {
    requestId: string;
    actorId: string;
    from: CampaignRequestStatus[];
    to: CampaignRequestStatus;
    reason?: string | null;
    approvalReference?: string | null;
    eventKind: RequestEventKind;
  },
): Promise<CampaignRequest> {
  const patch: {
    status: CampaignRequestStatus;
    reviewed_by: string;
    reviewed_at: string;
    review_reason?: string | null;
    approval_reference?: string | null;
  } = {
    status: input.to,
    reviewed_by: input.actorId,
    reviewed_at: new Date().toISOString(),
  };
  if (input.reason !== undefined) patch.review_reason = input.reason;
  if (input.approvalReference) patch.approval_reference = input.approvalReference;


  const { data: row, error } = await db
    .from("campaign_requests")
    .update(patch)
    .eq("id", input.requestId)
    .in("status", input.from)
    .select(COLUMNS)
    .maybeSingle<Row>();
  if (error) throw new Error(error.message);
  if (!row) {
    throw new Error("This request is no longer in a state that allows that action.");
  }

  await logRequestEvent(db, {
    requestId: input.requestId,
    actorId: input.actorId,
    kind: input.eventKind,
    note: input.reason ?? null,
  });

  return toModel(row, { includeInternal: true });
}

const NOTIFICATION_COPY: Partial<
  Record<CampaignRequestStatus, { title: string; body: (title: string) => string }>
> = {
  approved: {
    title: "Campaign request approved",
    body: (t) => `Your request "${t}" has been approved.`,
  },
  rejected: {
    title: "Campaign request rejected",
    body: (t) => `Your request "${t}" was not approved.`,
  },
  changes_requested: {
    title: "Changes requested",
    body: (t) => `Our team asked for changes to "${t}". Update it and resubmit.`,
  },
};

/** In-app notification for the owning business. Uses admin access to write cross-user rows. */
export async function notifyBusinessOfDecision(input: {
  businessId: string;
  requestId: string;
  requestTitle: string;
  status: CampaignRequestStatus;
  reason?: string | null;
}): Promise<void> {
  const copy = NOTIFICATION_COPY[input.status];
  if (!copy) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert({
    user_id: input.businessId,
    kind: "system",
    title: copy.title,
    body: input.reason ? `${copy.body(input.requestTitle)} ${input.reason}` : copy.body(input.requestTitle),
    link: `/app/business/requests/${input.requestId}`,
  });
}
