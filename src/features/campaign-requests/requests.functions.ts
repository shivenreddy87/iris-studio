import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  campaignRequestDraftSchema,
  campaignRequestSubmitSchema,
  type CampaignRequest,
  type CampaignRequestStatus,
} from "./types";
import {
  COLUMNS,
  isAdmin,
  listRequestsForAdmin,
  logRequestEvent,
  toModel,
  toPayload,
  type Row,
} from "./requests.server";


/** All requests belonging to the signed-in business, newest first. */
export const listMyCampaignRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignRequest[]> => {
    const { data, error } = await context.supabase
      .from("campaign_requests")
      .select(COLUMNS)
      .eq("business_id", context.userId)
      .order("created_at", { ascending: false })
      .returns<Row[]>();
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toModel(row));
  });

/** Back-compat alias used by the dashboard. */
export const listCampaignRequests = listMyCampaignRequests;

export const getCampaignRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<CampaignRequest | null> => {
    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle<Row>();
    if (error) throw new Error(error.message);
    if (!row) return null;

    const [{ data: profile }, admin] = await Promise.all([
      context.supabase
        .from("business_profiles")
        .select("business_name")
        .eq("user_id", row.business_id)
        .maybeSingle(),
      isAdmin(context.supabase, context.userId),
    ]);
    return toModel(row, {
      businessName: profile?.business_name ?? null,
      includeInternal: admin,
    });
  });

export const createCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => campaignRequestDraftSchema.parse(data))
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .insert({ ...toPayload(data), business_id: context.userId, status: "draft" })
      .select(COLUMNS)
      .single<Row>();
    if (error) throw new Error(error.message);
    await logRequestEvent(context.supabase, {
      requestId: row.id,
      actorId: context.userId,
      kind: "draft_created",
    });
    return toModel(row);
  });

export const updateCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const parsed = campaignRequestDraftSchema.parse((data as { values: unknown }).values);
    return { id: String((data as { id: string }).id), values: parsed };
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .update(toPayload(data.values))
      .eq("id", data.id)
      .eq("business_id", context.userId)
      .in("status", ["draft", "changes_requested"])
      .select(COLUMNS)
      .maybeSingle<Row>();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This request can no longer be edited.");
    return toModel(row);
  });



/**
 * Creates or updates an editable request and moves it to Submitted.
 * Valid sources: no id (new), `draft`, or `changes_requested` (a resubmission).
 */
export const submitCampaignRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const input = data as { id?: string; values: unknown };
    return { id: input.id, values: campaignRequestSubmitSchema.parse(input.values) };
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    const payload = {
      ...toPayload(data.values),
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: current } = await context.supabase
        .from("campaign_requests")
        .select("status")
        .eq("id", data.id)
        .eq("business_id", context.userId)
        .maybeSingle<{ status: CampaignRequestStatus }>();
      if (!current) throw new Error("Request not found.");
      if (current.status !== "draft" && current.status !== "changes_requested") {
        throw new Error("This request has already been submitted.");
      }

      const { data: row, error } = await context.supabase
        .from("campaign_requests")
        .update(payload)
        .eq("id", data.id)
        .eq("business_id", context.userId)
        .in("status", ["draft", "changes_requested"])
        .select(COLUMNS)
        .maybeSingle<Row>();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("This request has already been submitted.");
      await logRequestEvent(context.supabase, {
        requestId: row.id,
        actorId: context.userId,
        kind: current.status === "changes_requested" ? "resubmitted" : "submitted",
      });
      const { announceSubmission } = await import("./requests.server");
      await announceSubmission({
        requestId: row.id,
        title: row.title,
        businessId: context.userId,
        resubmission: current.status === "changes_requested",
      });
      return toModel(row);
    }

    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .insert({ ...payload, business_id: context.userId })
      .select(COLUMNS)
      .single<Row>();
    if (error) throw new Error(error.message);
    await logRequestEvent(context.supabase, {
      requestId: row.id,
      actorId: context.userId,
      kind: "submitted",
    });
    const { announceSubmission } = await import("./requests.server");
    await announceSubmission({
      requestId: row.id,
      title: row.title,
      businessId: context.userId,
      resubmission: false,
    });
    return toModel(row);
  });

export const deleteCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("campaign_requests")
      .delete()
      .eq("id", data.id)
      .eq("business_id", context.userId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

/** Admin-only: every request across all businesses. */
export const listAllCampaignRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignRequest[]> => {
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin) throw new Error("Forbidden");
    return listRequestsForAdmin(context.supabase);
  });

/** Admin-only: the review queue — submitted and under-review requests, oldest first. */
export const listPendingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignRequest[]> => {
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin) throw new Error("Forbidden");
    return listRequestsForAdmin(context.supabase, {
      statuses: ["submitted", "under_review"],
      ascending: true,
    });
  });

