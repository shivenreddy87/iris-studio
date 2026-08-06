import { createServerFn } from "@tanstack/react-start";
import { recordAdminAudit } from "@/lib/audit.server";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminReviewSummary, CampaignRequest, CampaignRequestEvent } from "./types";
import {
  applyReviewTransition,
  assertAdmin,
  fetchRequestEvents,
  isAdmin,
  loadReviewSummary,
  logRequestEvent,
  notifyBusinessOfDecision,
  requestOwnerInfo,
} from "./admin-review.server";

type IdInput = { id: string };
type DecisionInput = { id: string; reason?: string | undefined; note?: string | undefined };

/** Timeline for a request. Internal notes are only returned to admins. */
export const listRequestEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: IdInput) => data)
  .handler(async ({ data, context }): Promise<CampaignRequestEvent[]> => {
    const admin = await isAdmin(context.supabase, context.userId);
    return fetchRequestEvents(context.supabase, data.id, admin);
  });

/** Submitted -> Under Review */
export const startReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: IdInput) => data)
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    return applyReviewTransition(context.supabase, {
      requestId: data.id,
      actorId: context.userId,
      from: ["submitted"],
      to: "under_review",
      eventKind: "under_review",
    });
  });

/** Under Review -> Approved */
export const approveRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => data)
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const request = await applyReviewTransition(context.supabase, {
      requestId: data.id,
      actorId: context.userId,
      from: ["under_review"],
      to: "approved",
      reason: data.reason ?? null,
      eventKind: "approved",
    });
    const owner = await requestOwnerInfo(context.supabase, data.id);
    if (owner) {
      await notifyBusinessOfDecision({
        businessId: owner.businessId,
        requestId: data.id,
        requestTitle: owner.title,
        status: "approved",
        reason: data.reason ?? null,
      });
    }
    await recordAdminAudit(context.userId, "campaign_request", "approved", {
      entityId: data.id,
      newValues: { status: "approved", reason: data.reason ?? null },
    });
    return request;
  });

/** Under Review -> Rejected */
export const rejectRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => {
    if (!data.reason || data.reason.trim() === "") {
      throw new Error("A rejection reason is required.");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const request = await applyReviewTransition(context.supabase, {
      requestId: data.id,
      actorId: context.userId,
      from: ["under_review"],
      to: "rejected",
      reason: data.reason ?? null,
      eventKind: "rejected",
    });
    const owner = await requestOwnerInfo(context.supabase, data.id);
    if (owner) {
      await notifyBusinessOfDecision({
        businessId: owner.businessId,
        requestId: data.id,
        requestTitle: owner.title,
        status: "rejected",
        reason: data.reason ?? null,
      });
    }
    await recordAdminAudit(context.userId, "campaign_request", "rejected", {
      entityId: data.id,
      newValues: { status: "rejected", reason: data.reason ?? null },
    });
    return request;
  });

/** Under Review -> Changes Requested */
export const requestChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DecisionInput) => {
    if (!data.reason || data.reason.trim() === "") {
      throw new Error("Describe the changes the business should make.");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CampaignRequest> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const request = await applyReviewTransition(context.supabase, {
      requestId: data.id,
      actorId: context.userId,
      from: ["under_review"],
      to: "changes_requested",
      reason: data.reason ?? null,
      eventKind: "changes_requested",
    });
    const owner = await requestOwnerInfo(context.supabase, data.id);
    if (owner) {
      await notifyBusinessOfDecision({
        businessId: owner.businessId,
        requestId: data.id,
        requestTitle: owner.title,
        status: "changes_requested",
        reason: data.reason ?? null,
      });
    }
    await recordAdminAudit(context.userId, "campaign_request", "changes_requested", {
      entityId: data.id,
      newValues: { status: "changes_requested", reason: data.reason ?? null },
    });
    return request;
  });

/** Internal-only note visible to admins on the timeline. */
export const addInternalNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; note: string }) => {
    if (!data.note || data.note.trim() === "") throw new Error("Note cannot be empty.");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await logRequestEvent(context.supabase, {
      requestId: data.id,
      actorId: context.userId,
      kind: "note",
      note: data.note.trim(),
      internal: true,
    });
    return { ok: true };
  });

export const getAdminReviewSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReviewSummary> => {
    await assertAdmin(context.supabase, context.userId);
    return loadReviewSummary(context.supabase);
  });
