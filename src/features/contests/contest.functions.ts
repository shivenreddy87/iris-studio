import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { contestDraftSchema, contestPublishSchema } from "./contest.schema";
import {
  CONTEST_COLUMNS,
  applyContestTransition,
  assertAdmin,
  decorate,
  fetchContestEvents,
  isAdmin,
  logContestEvent,
  notifyBusinessOfContest,
  toContest,
  toInheritedPayload,
  toOperationalPayload,
  type ContestRow,
} from "./contest.server";
import type { Contest, ContestEvent, ContestSource, ContestStatus } from "./types";

type RequestRow = {
  id: string;
  business_id: string;
  title: string;
  campaign_goal: string | null;
  business_category: string | null;
  target_platform: string | null;
  target_location: string | null;
  required_views: number | null;
  budget: number | string | null;
  preferred_creator_category: string | null;
  minimum_followers: number | null;
  maximum_followers: number | null;
  campaign_description: string | null;
  attachment_url: string | null;
  approval_reference: string | null;
  reviewed_at: string | null;
};

const REQUEST_COLUMNS =
  "id, business_id, title, campaign_goal, business_category, target_platform, target_location, required_views, budget, preferred_creator_category, minimum_followers, maximum_followers, campaign_description, attachment_url, approval_reference, reviewed_at";

/** Admin-only: approved campaign requests that do not have a contest yet. */
export const listApprovedRequestsWithoutContest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContestSource[]> => {
    await assertAdmin(context.supabase, context.userId);
    const [{ data: requests, error }, { data: contests }] = await Promise.all([
      context.supabase
        .from("campaign_requests")
        .select(REQUEST_COLUMNS)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false })
        .returns<RequestRow[]>(),
      context.supabase.from("contests").select("campaign_request_id"),
    ]);
    if (error) throw new Error(error.message);
    const taken = new Set((contests ?? []).map((c) => c.campaign_request_id));
    const rows = (requests ?? []).filter((r) => !taken.has(r.id));
    if (rows.length === 0) return [];

    const { data: profiles } = await context.supabase
      .from("business_profiles")
      .select("user_id, business_name")
      .in("user_id", [...new Set(rows.map((r) => r.business_id))]);
    const names = new Map((profiles ?? []).map((p) => [p.user_id, p.business_name]));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      businessId: row.business_id,
      businessName: names.get(row.business_id) ?? null,
      approvalReference: row.approval_reference,
      businessCategory: row.business_category,
      targetPlatform: row.target_platform,
      requiredViews: row.required_views,
      budget: row.budget === null ? null : Number(row.budget),
      approvedAt: row.reviewed_at,
    }));
  });

/** Admin-only: creates a Draft contest pre-filled from one approved campaign request. */
export const createContestFromRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignRequestId: string }) => data)
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);

    const { data: request, error: requestError } = await context.supabase
      .from("campaign_requests")
      .select(REQUEST_COLUMNS)
      .eq("id", data.campaignRequestId)
      .eq("status", "approved")
      .maybeSingle<RequestRow>();
    if (requestError) throw new Error(requestError.message);
    if (!request) throw new Error("Only an approved campaign request can become a contest.");

    const { data: row, error } = await context.supabase
      .from("contests")
      .insert({
        campaign_request_id: request.id,
        business_id: request.business_id,
        title: request.title,
        description: request.campaign_description,
        campaign_goal: request.campaign_goal,
        business_category: request.business_category,
        target_platform: request.target_platform,
        target_location: request.target_location,
        required_views: request.required_views,
        reward_pool: request.budget === null ? null : Number(request.budget),
        preferred_creator_category: request.preferred_creator_category,
        minimum_followers: request.minimum_followers,
        maximum_followers: request.maximum_followers,
        attachment_url: request.attachment_url,
        status: "draft",
        created_by: context.userId,
      })
      .select(CONTEST_COLUMNS)
      .maybeSingle<ContestRow>();
    // The unique constraint on campaign_request_id makes duplicates impossible,
    // including under concurrent requests.
    if (error) {
      if (error.code === "23505") {
        throw new Error("A contest already exists for this campaign request.");
      }
      throw new Error(error.message);
    }
    if (!row) throw new Error("Could not create the contest.");

    await logContestEvent(context.supabase, {
      contestId: row.id,
      actorId: context.userId,
      eventType: "created",
    });
    await notifyBusinessOfContest({
      businessId: row.business_id,
      contestId: row.id,
      contestTitle: row.title,
      status: "draft",
    });

    return toContest(row, { approvalReference: request.approval_reference });
  });

/** Admin-only: saves wizard values. Inherited fields are frozen after publishing. */
export const updateDraftContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const input = data as { id: string; values: unknown };
    return { id: String(input.id), values: contestDraftSchema.parse(input.values) };
  })
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);

    const { data: current } = await context.supabase
      .from("contests")
      .select("status")
      .eq("id", data.id)
      .maybeSingle<{ status: ContestStatus }>();
    if (!current) throw new Error("Contest not found.");
    if (current.status === "archived" || current.status === "completed") {
      throw new Error("This contest can no longer be edited.");
    }

    const payload =
      current.status === "draft"
        ? { ...toInheritedPayload(data.values), ...toOperationalPayload(data.values) }
        : toOperationalPayload(data.values);

    const { data: row, error } = await context.supabase
      .from("contests")
      .update(payload)
      .eq("id", data.id)
      .select(CONTEST_COLUMNS)
      .maybeSingle<ContestRow>();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Contest not found.");

    await logContestEvent(context.supabase, {
      contestId: row.id,
      actorId: context.userId,
      eventType: "updated",
    });
    return toContest(row);
  });

/** Admin-only: Draft -> Published, validating the full contest first. */
export const publishContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const input = data as { id: string; values: unknown };
    return { id: String(input.id), values: contestPublishSchema.parse(input.values) };
  })
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);

    const { error: updateError } = await context.supabase
      .from("contests")
      .update({ ...toInheritedPayload(data.values), ...toOperationalPayload(data.values) })
      .eq("id", data.id)
      .eq("status", "draft");
    if (updateError) throw new Error(updateError.message);

    const contest = await applyContestTransition(context.supabase, {
      contestId: data.id,
      actorId: context.userId,
      to: "published",
    });
    await notifyBusinessOfContest({
      businessId: contest.businessId,
      contestId: contest.id,
      contestTitle: contest.title,
      status: "published",
    });
    return contest;
  });

/** Admin-only: any other lifecycle move, validated against the allowed transitions. */
export const transitionContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; to: ContestStatus; note?: string | undefined }) => data)
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    return applyContestTransition(context.supabase, {
      contestId: data.id,
      actorId: context.userId,
      to: data.to,
      note: data.note ?? null,
    });
  });

/** Admin-only: archiving is the only way to retire a published contest. */
export const archiveContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; note?: string | undefined }) => data)
  .handler(async ({ data, context }): Promise<Contest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const contest = await applyContestTransition(context.supabase, {
      contestId: data.id,
      actorId: context.userId,
      to: "archived",
      note: data.note ?? null,
    });
    await notifyBusinessOfContest({
      businessId: contest.businessId,
      contestId: contest.id,
      contestTitle: contest.title,
      status: "archived",
    });
    return contest;
  });

/** Admin-only: only an unpublished draft can be deleted outright. */
export const deleteDraftContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("contests")
      .delete()
      .eq("id", data.id)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

/** Readable by admins and by the business that owns the originating request (RLS). */
export const getContest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<Contest | null> => {
    const { data: row, error } = await context.supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .eq("id", data.id)
      .maybeSingle<ContestRow>();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [contest] = await decorate(context.supabase, [row]);
    return contest ?? null;
  });

/** Admin-only: every contest on the platform, newest first. */
export const listContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Contest[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .order("created_at", { ascending: false })
      .returns<ContestRow[]>();
    if (error) throw new Error(error.message);
    return decorate(context.supabase, data ?? []);
  });

/** Contests created from the signed-in business's own campaign requests. */
export const listMyContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Contest[]> => {
    const { data, error } = await context.supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .eq("business_id", context.userId)
      .order("created_at", { ascending: false })
      .returns<ContestRow[]>();
    if (error) throw new Error(error.message);
    return decorate(context.supabase, data ?? []);
  });

/** Full event history for the contest timeline. */
export const listContestEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<ContestEvent[]> => {
    // Admins and the owning business both pass RLS; anyone else gets nothing.
    await isAdmin(context.supabase, context.userId);
    return fetchContestEvents(context.supabase, data.id);
  });
