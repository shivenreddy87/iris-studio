import type { Db } from "@/features/contest-applications/application.server";
import { assertAdmin } from "@/features/contest-submissions/submission.server";
import type { Contest } from "@/features/contests/types";
import {
  humaniseEventType,
  isPayoutImmutable,
  type Payout,
  type PayoutDetails,
  type PayoutEvent,
  type PayoutProgress,
  type PayoutStatus,
  type RewardEntry,
} from "./types";
import type { PayoutDetailsInput } from "./payout.schema";

export type { Db };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const PAYOUT_COLUMNS =
  "id, contest_id, winner_id, business_id, influencer_id, amount, currency, status, payment_method, payment_reference, payment_provider, provider_transaction_id, provider_status, internal_notes, failure_reason, requested_at, processing_at, paid_at, failed_at, cancelled_at, created_at, updated_at";

const DETAILS_COLUMNS =
  "id, winner_id, influencer_id, full_name, phone, email, country, bank_holder_name, bank_name, account_number, ifsc, swift, upi_id, paypal_email, government_id_url, tax_id, declaration_accepted, submitted_at, verified_at, verified_by";

type PayoutRow = {
  id: string;
  contest_id: string;
  winner_id: string;
  business_id: string;
  influencer_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payment_method: string | null;
  payment_reference: string | null;
  payment_provider: string;
  provider_transaction_id: string | null;
  provider_status: string | null;
  internal_notes: string | null;
  failure_reason: string | null;
  requested_at: string | null;
  processing_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type DetailsRow = {
  id: string;
  winner_id: string;
  influencer_id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  bank_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string | null;
  swift: string | null;
  upi_id: string | null;
  paypal_email: string | null;
  government_id_url: string | null;
  tax_id: string | null;
  declaration_accepted: boolean;
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
};

/* ------------------------------------------------------------------ */
/* Lifecycle rules                                                     */
/* ------------------------------------------------------------------ */

/**
 * Allowed transitions. Everything not listed here is rejected server-side,
 * and `paid` is terminal by omission.
 */
const TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ["details_requested", "processing", "cancelled"],
  details_requested: ["waiting_for_details", "processing", "cancelled"],
  waiting_for_details: ["processing", "details_requested", "cancelled"],
  processing: ["paid", "failed", "cancelled"],
  paid: [],
  failed: ["processing", "cancelled"],
  cancelled: [],
};

export function assertTransition(from: PayoutStatus, to: PayoutStatus): void {
  if (isPayoutImmutable(from)) {
    throw new Error("This payout has been paid and can no longer be changed.");
  }
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error(`A payout cannot move from ${from} to ${to}.`);
  }
}

export async function assertAdminCaller(db: Db, userId: string): Promise<void> {
  await assertAdmin(db, userId);
}

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

async function loadPeople(userIds: string[]) {
  const map = new Map<string, { name: string | null; handle: string | null }>();
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return map;
  const sb = await admin();
  const [{ data: profiles }, { data: creators }, { data: businesses }] = await Promise.all([
    sb.from("profiles").select("id, full_name").in("id", ids),
    sb.from("creator_profiles").select("user_id, display_name, handle").in("user_id", ids),
    sb.from("business_profiles").select("user_id, business_name").in("user_id", ids),
  ]);
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id as string, c]));
  const businessMap = new Map((businesses ?? []).map((b) => [b.user_id as string, b]));
  for (const id of ids) {
    const creator = creatorMap.get(id);
    const business = businessMap.get(id);
    const profile = (profiles ?? []).find((p) => p.id === id);
    map.set(id, {
      name:
        (business?.business_name as string | null) ??
        (creator?.display_name as string | null) ??
        (profile?.full_name as string | null) ??
        null,
      handle: (creator?.handle as string | null) ?? null,
    });
  }
  return map;
}

function toDetails(row: DetailsRow): PayoutDetails {
  return {
    id: row.id,
    winnerId: row.winner_id,
    influencerId: row.influencer_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    country: row.country,
    bankHolderName: row.bank_holder_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    ifsc: row.ifsc,
    swift: row.swift,
    upiId: row.upi_id,
    paypalEmail: row.paypal_email,
    governmentIdUrl: row.government_id_url,
    taxId: row.tax_id,
    declarationAccepted: row.declaration_accepted,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
  };
}

type Decoration = {
  contests: Map<string, { title: string }>;
  ranks: Map<string, number>;
  people: Map<string, { name: string | null; handle: string | null }>;
  details: Map<string, DetailsRow>;
};

async function decorate(rows: PayoutRow[]): Promise<Decoration> {
  const sb = await admin();
  const contestIds = [...new Set(rows.map((r) => r.contest_id))];
  const winnerIds = [...new Set(rows.map((r) => r.winner_id))];

  const [{ data: contests }, { data: winners }, { data: details }] = await Promise.all([
    contestIds.length
      ? sb.from("contests").select("id, title").in("id", contestIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    winnerIds.length
      ? sb.from("contest_winners").select("id, rank").in("id", winnerIds)
      : Promise.resolve({ data: [] as { id: string; rank: number }[] }),
    winnerIds.length
      ? sb.from("payout_details").select(DETAILS_COLUMNS).in("winner_id", winnerIds)
      : Promise.resolve({ data: [] as DetailsRow[] }),
  ]);

  const people = await loadPeople(rows.flatMap((r) => [r.influencer_id, r.business_id]));

  return {
    contests: new Map(
      ((contests ?? []) as { id: string; title: string }[]).map((c) => [c.id, { title: c.title }]),
    ),
    ranks: new Map(((winners ?? []) as { id: string; rank: number }[]).map((w) => [w.id, w.rank])),
    people,
    details: new Map(((details ?? []) as DetailsRow[]).map((d) => [d.winner_id, d])),
  };
}

function toPayout(row: PayoutRow, d: Decoration, includeSensitive: boolean): Payout {
  const details = d.details.get(row.winner_id);
  const influencer = d.people.get(row.influencer_id);
  const business = d.people.get(row.business_id);
  return {
    id: row.id,
    contestId: row.contest_id,
    contestTitle: d.contests.get(row.contest_id)?.title ?? "Contest",
    winnerId: row.winner_id,
    rank: d.ranks.get(row.winner_id) ?? 0,
    businessId: row.business_id,
    businessName: business?.name ?? null,
    influencerId: row.influencer_id,
    influencerName: influencer?.name ?? null,
    influencerHandle: influencer?.handle ?? null,
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    paymentProvider: row.payment_provider,
    providerTransactionId: row.provider_transaction_id,
    providerStatus: row.provider_status,
    internalNotes: includeSensitive ? row.internal_notes : null,
    failureReason: row.failure_reason,
    requestedAt: row.requested_at,
    processingAt: row.processing_at,
    paidAt: row.paid_at,
    failedAt: row.failed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hasDetails: Boolean(details),
    detailsVerified: Boolean(details?.verified_at),
  };
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export async function logPayoutEvent(input: {
  payoutId: string;
  actorId: string | null;
  eventType: string;
  note?: string | null;
  internal?: boolean;
}): Promise<void> {
  const sb = await admin();
  await sb.from("payout_events").insert({
    payout_id: input.payoutId,
    actor_id: input.actorId,
    event_type: input.eventType,
    note: input.note ?? null,
    internal: input.internal ?? false,
  });
}

export async function fetchPayoutEvents(
  payoutId: string,
  includeInternal: boolean,
): Promise<PayoutEvent[]> {
  const sb = await admin();
  let query = sb
    .from("payout_events")
    .select("id, payout_id, actor_id, event_type, note, internal, created_at")
    .eq("payout_id", payoutId)
    .order("created_at", { ascending: true });
  if (!includeInternal) query = query.eq("internal", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const people = await loadPeople(rows.map((r) => r.actor_id as string).filter(Boolean));
  return rows.map((row) => ({
    id: row.id as string,
    payoutId: row.payout_id as string,
    actorId: (row.actor_id as string | null) ?? null,
    actorName: row.actor_id ? (people.get(row.actor_id as string)?.name ?? null) : null,
    eventType: row.event_type as string,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
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
  const sb = await admin();
  await sb.from("notifications").insert(rows);
}

async function adminUserIds(): Promise<string[]> {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  return (data ?? []).map((r) => r.user_id as string);
}

async function notifyInfluencer(payout: PayoutRow, title: string, body: string): Promise<void> {
  await insertNotifications([
    { user_id: payout.influencer_id, kind: "system", title, body, link: "/app/rewards" },
  ]);
}

async function notifyAdmins(title: string, body: string, link: string): Promise<void> {
  const ids = await adminUserIds();
  await insertNotifications(ids.map((id) => ({ user_id: id, kind: "system" as const, title, body, link })));
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function fetchPayoutRow(payoutId: string): Promise<PayoutRow> {
  const sb = await admin();
  const { data, error } = await sb
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("id", payoutId)
    .maybeSingle<PayoutRow>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Payout not found.");
  return data;
}

export async function listAdminPayoutRows(filters: {
  contestId?: string | undefined;
  status?: PayoutStatus | undefined;
  search?: string | undefined;
}): Promise<Payout[]> {
  const sb = await admin();
  let query = sb.from("payouts").select(PAYOUT_COLUMNS).order("created_at", { ascending: false });
  if (filters.contestId) query = query.eq("contest_id", filters.contestId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query.returns<PayoutRow[]>();
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) return [];
  const decoration = await decorate(rows);
  const payouts = rows.map((row) => toPayout(row, decoration, true));

  const search = filters.search?.trim().toLowerCase();
  if (!search) return payouts;
  return payouts.filter((p) =>
    [p.contestTitle, p.businessName, p.influencerName, p.influencerHandle, p.paymentReference]
      .filter(Boolean)
      .some((value) => (value as string).toLowerCase().includes(search)),
  );
}

/** Influencer: their own rewards with timeline and submitted details. */
export async function fetchMyRewards(userId: string): Promise<RewardEntry[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("influencer_id", userId)
    .order("created_at", { ascending: false })
    .returns<PayoutRow[]>();
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) return [];
  const decoration = await decorate(rows);

  const entries: RewardEntry[] = [];
  for (const row of rows) {
    const details = decoration.details.get(row.winner_id);
    entries.push({
      payout: toPayout(row, decoration, false),
      details: details ? toDetails(details) : null,
      events: await fetchPayoutEvents(row.id, false),
      needsDetails:
        !details && (row.status === "details_requested" || row.status === "waiting_for_details"),
    });
  }
  return entries;
}

/** Admin: the full payment details a winner submitted. */
export async function fetchPayoutDetails(winnerId: string): Promise<PayoutDetails | null> {
  const sb = await admin();
  const { data } = await sb
    .from("payout_details")
    .select(DETAILS_COLUMNS)
    .eq("winner_id", winnerId)
    .maybeSingle<DetailsRow>();
  return data ? toDetails(data) : null;
}

/** Aggregate-only progress. Safe for businesses — no personal data. */
export async function fetchPayoutProgress(contestId: string): Promise<PayoutProgress> {
  const sb = await admin();
  const { data, error } = await sb
    .from("payouts")
    .select("status, amount")
    .eq("contest_id", contestId);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { status: PayoutStatus; amount: number }[];
  const progress: PayoutProgress = {
    contestId,
    totalWinners: rows.length,
    pending: 0,
    processing: 0,
    paid: 0,
    failed: 0,
    cancelled: 0,
    totalAmount: 0,
    paidAmount: 0,
  };
  for (const row of rows) {
    const amount = Number(row.amount ?? 0);
    progress.totalAmount += amount;
    if (row.status === "paid") {
      progress.paid += 1;
      progress.paidAmount += amount;
    } else if (row.status === "processing") progress.processing += 1;
    else if (row.status === "failed") progress.failed += 1;
    else if (row.status === "cancelled") progress.cancelled += 1;
    else progress.pending += 1;
  }
  return progress;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/**
 * Creates one payout per finalized winner. Safe to call repeatedly: the unique
 * winner constraint keeps it idempotent, so it also backfills older contests.
 */
export async function createPayoutsForContest(
  contest: Contest,
  actorId: string | null,
): Promise<number> {
  if (contest.status !== "completed" && contest.status !== "archived") {
    throw new Error("Payouts can only be created for completed contests.");
  }
  const sb = await admin();
  const { data: winners, error } = await sb
    .from("contest_winners")
    .select("id, influencer_id, reward_amount")
    .eq("contest_id", contest.id);
  if (error) throw new Error(error.message);
  if (!winners || winners.length === 0) {
    throw new Error("This contest has no declared winners.");
  }

  const { data: existing } = await sb
    .from("payouts")
    .select("winner_id")
    .eq("contest_id", contest.id);
  const known = new Set((existing ?? []).map((r) => r.winner_id as string));

  const rows = winners
    .filter((w) => !known.has(w.id as string))
    .map((w) => ({
      contest_id: contest.id,
      winner_id: w.id as string,
      business_id: contest.businessId,
      influencer_id: w.influencer_id as string,
      amount: Number(w.reward_amount ?? 0),
      status: "pending" as PayoutStatus,
    }));
  if (rows.length === 0) return 0;

  const { data: inserted, error: insertError } = await sb
    .from("payouts")
    .insert(rows)
    .select("id")
    .returns<{ id: string }[]>();
  if (insertError) throw new Error(insertError.message);

  for (const row of inserted ?? []) {
    await logPayoutEvent({
      payoutId: row.id,
      actorId,
      eventType: "payout_created",
      note: `Payout opened for “${contest.title}”.`,
    });
  }
  return (inserted ?? []).length;
}

async function updatePayout(payoutId: string, patch: Record<string, unknown>): Promise<void> {
  const sb = await admin();
  const { error } = await sb.from("payouts").update(patch).eq("id", payoutId);
  if (error) throw new Error(error.message);
}

export async function requestWinnerDetails(
  payoutId: string,
  actorId: string,
  note?: string | undefined,
): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  assertTransition(payout.status, "details_requested");
  await updatePayout(payoutId, {
    status: "waiting_for_details",
    requested_at: new Date().toISOString(),
  });
  await logPayoutEvent({
    payoutId,
    actorId,
    eventType: "details_requested",
    note: note ?? null,
  });
  await notifyInfluencer(
    payout,
    "Payout details required",
    "Complete your payout details so your reward can be paid out.",
  );
}

export async function submitWinnerDetails(
  input: PayoutDetailsInput,
  userId: string,
): Promise<void> {
  const sb = await admin();
  const { data: payout } = await sb
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("winner_id", input.winnerId)
    .maybeSingle<PayoutRow>();
  if (!payout) throw new Error("No payout exists for this win yet.");
  if (payout.influencer_id !== userId) throw new Error("This payout does not belong to you.");
  if (isPayoutImmutable(payout.status)) {
    throw new Error("This payout has already been paid.");
  }

  const { data: existing } = await sb
    .from("payout_details")
    .select("id")
    .eq("winner_id", input.winnerId)
    .maybeSingle();
  if (existing) throw new Error("Your payout details have already been submitted.");

  const { error } = await sb.from("payout_details").insert({
    winner_id: input.winnerId,
    influencer_id: userId,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    country: input.country,
    bank_holder_name: input.bankHolderName,
    bank_name: input.bankName,
    account_number: input.accountNumber,
    ifsc: input.ifsc ?? null,
    swift: input.swift ?? null,
    upi_id: input.upiId ?? null,
    paypal_email: input.paypalEmail ?? null,
    government_id_url: input.governmentIdUrl ?? null,
    tax_id: input.taxId ?? null,
    declaration_accepted: true,
  });
  if (error) throw new Error(error.message);

  await logPayoutEvent({
    payoutId: payout.id,
    actorId: userId,
    eventType: "details_submitted",
    note: "Payout details submitted for review.",
  });
  await notifyInfluencer(
    payout,
    "Payout details received",
    "We have received your payout details and will review them shortly.",
  );
  await notifyAdmins(
    "Winner payout details submitted",
    "A winner has submitted their payout details for review.",
    "/app/admin/payouts",
  );
}

export async function verifyWinnerDetails(payoutId: string, actorId: string): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  if (isPayoutImmutable(payout.status)) {
    throw new Error("This payout has already been paid.");
  }
  const sb = await admin();
  const { data: details } = await sb
    .from("payout_details")
    .select("id, verified_at")
    .eq("winner_id", payout.winner_id)
    .maybeSingle<{ id: string; verified_at: string | null }>();
  if (!details) throw new Error("This winner has not submitted payout details yet.");
  if (details.verified_at) return;

  await sb
    .from("payout_details")
    .update({ verified_at: new Date().toISOString(), verified_by: actorId })
    .eq("id", details.id);
  await logPayoutEvent({
    payoutId,
    actorId,
    eventType: "details_verified",
    note: "Payout details verified.",
  });
}

export async function startProcessing(payoutId: string, actorId: string): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  assertTransition(payout.status, "processing");

  const details = await fetchPayoutDetails(payout.winner_id);
  if (!details) throw new Error("The winner has not submitted payout details yet.");
  if (!details.verifiedAt) throw new Error("Verify the winner's payout details before processing.");

  await updatePayout(payoutId, {
    status: "processing",
    processing_at: new Date().toISOString(),
    failure_reason: null,
  });
  await logPayoutEvent({ payoutId, actorId, eventType: "processing_started" });
  await notifyInfluencer(
    payout,
    "Payment processing",
    "Your reward payment is being processed.",
  );
}

export async function markPaid(
  input: { payoutId: string; paymentMethod: string; paymentReference: string; note?: string | undefined },
  actorId: string,
): Promise<void> {
  const payout = await fetchPayoutRow(input.payoutId);
  assertTransition(payout.status, "paid");
  await updatePayout(input.payoutId, {
    status: "paid",
    payment_method: input.paymentMethod,
    payment_reference: input.paymentReference,
    paid_at: new Date().toISOString(),
    failure_reason: null,
  });
  await logPayoutEvent({
    payoutId: input.payoutId,
    actorId,
    eventType: "payment_completed",
    note: input.note ?? `Paid via ${input.paymentMethod} · ref ${input.paymentReference}`,
  });
  await notifyInfluencer(
    payout,
    "Reward paid",
    `Your reward has been paid via ${input.paymentMethod}. Reference: ${input.paymentReference}.`,
  );
  await maybeNotifyContestPayoutsComplete(payout);
}

export async function markFailed(
  input: { payoutId: string; failureReason: string },
  actorId: string,
): Promise<void> {
  const payout = await fetchPayoutRow(input.payoutId);
  assertTransition(payout.status, "failed");
  await updatePayout(input.payoutId, {
    status: "failed",
    failed_at: new Date().toISOString(),
    failure_reason: input.failureReason,
  });
  await logPayoutEvent({
    payoutId: input.payoutId,
    actorId,
    eventType: "payment_failed",
    note: input.failureReason,
  });
  await notifyInfluencer(
    payout,
    "Payment failed",
    "Your reward payment could not be completed. The team is looking into it.",
  );
  await notifyAdmins("Payout failed", "A reward payment failed and needs attention.", "/app/admin/payouts");
}

export async function retryFailedPayment(payoutId: string, actorId: string): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  if (payout.status !== "failed") throw new Error("Only failed payouts can be retried.");
  await logPayoutEvent({ payoutId, actorId, eventType: "retry_requested" });
  await startProcessing(payoutId, actorId);
}

export async function cancelPayout(
  payoutId: string,
  actorId: string,
  note?: string | undefined,
): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  assertTransition(payout.status, "cancelled");
  await updatePayout(payoutId, {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  });
  await logPayoutEvent({
    payoutId,
    actorId,
    eventType: "payment_cancelled",
    note: note ?? null,
  });
}

export async function saveInternalNotes(
  payoutId: string,
  notes: string,
  actorId: string,
): Promise<void> {
  const payout = await fetchPayoutRow(payoutId);
  if (isPayoutImmutable(payout.status)) {
    throw new Error("This payout has been paid and can no longer be changed.");
  }
  await updatePayout(payoutId, { internal_notes: notes });
  await logPayoutEvent({
    payoutId,
    actorId,
    eventType: "internal_note_added",
    note: notes,
    internal: true,
  });
}

/** Tells the business once every payout for their contest is settled. */
async function maybeNotifyContestPayoutsComplete(payout: PayoutRow): Promise<void> {
  const progress = await fetchPayoutProgress(payout.contest_id);
  const settled = progress.paid + progress.cancelled;
  if (progress.totalWinners === 0 || settled < progress.totalWinners) return;

  const sb = await admin();
  const { data: contest } = await sb
    .from("contests")
    .select("title")
    .eq("id", payout.contest_id)
    .maybeSingle<{ title: string }>();

  await insertNotifications([
    {
      user_id: payout.business_id,
      kind: "system",
      title: "Contest payouts completed",
      body: `All winner rewards for “${contest?.title ?? "your contest"}” have been settled.`,
      link: `/app/business/contests/${payout.contest_id}`,
    },
  ]);
}

export { humaniseEventType };
