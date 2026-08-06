import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  campaignRequestDraftSchema,
  campaignRequestSubmitSchema,
  type CampaignRequest,
  type CampaignRequestStatus,
} from "./types";

type Row = {
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
  review_notes: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, business_id, title, campaign_goal, business_category, target_audience, target_platform, target_location, required_views, budget, duration_days, preferred_creator_category, minimum_followers, maximum_followers, campaign_description, attachment_url, status, submitted_at, reviewed_at, review_notes, created_at, updated_at";

function toModel(row: Row, businessName: string | null = null): CampaignRequest {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName,
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
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type Payload = {
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

function toPayload(v: {
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

    const { data: profile } = await context.supabase
      .from("business_profiles")
      .select("business_name")
      .eq("user_id", row.business_id)
      .maybeSingle();
    return toModel(row, profile?.business_name ?? null);
  });

export const createCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => campaignRequestDraftSchema.parse(data))
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .insert({ ...toPayload(data), business_id: context.userId, status: "draft" })
      .select(COLUMNS)
      .single<Row>();
    if (error) throw new Error(error.message);
    return toModel(row);
  });

export const updateCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const parsed = campaignRequestDraftSchema
      .extend(campaignRequestDraftSchema.shape)
      .parse((data as { values: unknown }).values);
    return { id: String((data as { id: string }).id), values: parsed };
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .update(toPayload(data.values))
      .eq("id", data.id)
      .eq("business_id", context.userId)
      .eq("status", "draft")
      .select(COLUMNS)
      .maybeSingle<Row>();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This request can no longer be edited.");
    return toModel(row);
  });

/** Creates or updates a draft and moves it to Submitted (read-only afterwards). */
export const submitCampaignRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const input = data as { id?: string; values: unknown };
    return { id: input.id, values: campaignRequestSubmitSchema.parse(input.values) };
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    const payload = {
      ...toPayload(data.values),
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("campaign_requests")
        .update(payload)
        .eq("id", data.id)
        .eq("business_id", context.userId)
        .eq("status", "draft")
        .select(COLUMNS)
        .maybeSingle<Row>();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("This request has already been submitted.");
      return toModel(row);
    }

    const { data: row, error } = await context.supabase
      .from("campaign_requests")
      .insert({ ...payload, business_id: context.userId })
      .select(COLUMNS)
      .single<Row>();
    if (error) throw new Error(error.message);
    return toModel(row);
  });

export const deleteCampaignRequestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
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
    const { data, error } = await context.supabase
      .from("campaign_requests")
      .select(COLUMNS)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .returns<Row[]>();
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const { data: profiles } = await context.supabase
      .from("business_profiles")
      .select("user_id, business_name")
      .in("user_id", [...new Set(rows.map((r) => r.business_id))]);
    const names = new Map((profiles ?? []).map((p) => [p.user_id, p.business_name]));
    return rows.map((row) => toModel(row, names.get(row.business_id) ?? null));
  });
