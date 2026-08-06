import { createServerFn } from "@tanstack/react-start";
import { recordAuditLog } from "@/lib/audit.server";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/features/contests/contest.server";
import { fetchContestOrThrow } from "@/features/contest-submissions/submission.server";
import {
  cancelPayout,
  createPayoutsForContest,
  fetchMyRewards,
  fetchPayoutDetails,
  fetchPayoutEvents,
  fetchPayoutProgress,
  listAdminPayoutRows,
  markFailed,
  markPaid,
  requestWinnerDetails,
  retryFailedPayment,
  saveInternalNotes,
  startProcessing,
  submitWinnerDetails,
  verifyWinnerDetails,
} from "./payout.server";
import {
  bulkPayoutSchema,
  internalNotesSchema,
  markFailedSchema,
  markPaidSchema,
  payoutDetailsSchema,
  payoutNoteSchema,
} from "./payout.schema";
import type {
  Payout,
  PayoutDetails,
  PayoutEvent,
  PayoutProgress,
  PayoutStatus,
  RewardEntry,
} from "./types";

/* ----------------------------- Admin reads ----------------------------- */

export const listPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { contestId?: string; status?: PayoutStatus; search?: string }) => data ?? {},
  )
  .handler(async ({ data, context }): Promise<Payout[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listAdminPayoutRows({
      contestId: data.contestId,
      status: data.status,
      search: data.search,
    });
  });

export const getPayoutTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { payoutId: string }) => data)
  .handler(async ({ data, context }): Promise<PayoutEvent[]> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchPayoutEvents(data.payoutId, true);
  });

export const getWinnerPayoutDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { winnerId: string }) => data)
  .handler(async ({ data, context }): Promise<PayoutDetails | null> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchPayoutDetails(data.winnerId);
  });

/* ---------------------------- Admin actions ---------------------------- */

/** Opens payouts for every declared winner of a completed contest. */
export const openContestPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<{ created: number }> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const contest = await fetchContestOrThrow(supabase, data.contestId);
    const created = await createPayoutsForContest(contest, userId);
    return { created };
  });

export const requestPayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkPayoutSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ updated: number }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    let updated = 0;
    for (const payoutId of data.payoutIds) {
      await requestWinnerDetails(payoutId, context.userId, data.note);
      updated += 1;
    }
    return { updated };
  });

export const verifyPayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { payoutId: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await verifyWinnerDetails(data.payoutId, context.userId);
    return { ok: true };
  });

export const beginPayoutProcessing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkPayoutSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ updated: number }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    let updated = 0;
    for (const payoutId of data.payoutIds) {
      await startProcessing(payoutId, context.userId);
      updated += 1;
    }
    return { updated };
  });

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => markPaidSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await markPaid(data, context.userId);
    await recordAuditLog({
      actorId: context.userId,
      actorRole: "admin",
      entityType: "payout",
      entityId: data.payoutId,
      action: "mark_paid",
      newValues: data,
    });
    return { ok: true };
  });

export const markPayoutFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => markFailedSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await markFailed(data, context.userId);
    return { ok: true };
  });

export const retryPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { payoutId: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await retryFailedPayment(data.payoutId, context.userId);
    return { ok: true };
  });

export const cancelPayoutRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => payoutNoteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await cancelPayout(data.payoutId, context.userId, data.note);
    return { ok: true };
  });

export const savePayoutNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => internalNotesSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await saveInternalNotes(data.payoutId, data.internalNotes, context.userId);
    return { ok: true };
  });

/* -------------------------- Influencer surface ------------------------- */

export const listMyRewards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RewardEntry[]> => fetchMyRewards(context.userId));

export const submitMyPayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => payoutDetailsSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await submitWinnerDetails(data, context.userId);
    await recordAuditLog({
      actorId: context.userId,
      actorRole: "influencer",
      entityType: "payout_details",
      entityId: data.winnerId,
      action: "submit",
    });
    return { ok: true };
  });

/* --------------------------- Business surface -------------------------- */

/** Aggregate payout progress only — never exposes winner payment details. */
export const getContestPayoutProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<PayoutProgress> => {
    const contest = await fetchContestOrThrow(context.supabase, data.contestId);
    return fetchPayoutProgress(contest.id);
  });
