import type { Database } from "@/integrations/supabase/types";

export type PayoutStatus = Database["public"]["Enums"]["payout_status"];

export const PAYOUT_STATUSES: PayoutStatus[] = [
  "pending",
  "details_requested",
  "waiting_for_details",
  "processing",
  "paid",
  "failed",
  "cancelled",
];

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: "Pending",
  details_requested: "Details requested",
  waiting_for_details: "Waiting for details",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const PAYOUT_STATUS_TONES: Record<
  PayoutStatus,
  "neutral" | "info" | "warning" | "success" | "danger"
> = {
  pending: "neutral",
  details_requested: "info",
  waiting_for_details: "warning",
  processing: "info",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
};

/** Dashboard groupings for the admin workspace. */
export const PAYOUT_SECTIONS: { key: string; label: string; statuses: PayoutStatus[] }[] = [
  {
    key: "pending",
    label: "Pending",
    statuses: ["pending", "details_requested", "waiting_for_details"],
  },
  { key: "processing", label: "Processing", statuses: ["processing"] },
  { key: "paid", label: "Paid", statuses: ["paid"] },
  { key: "failed", label: "Failed", statuses: ["failed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

/**
 * Payment methods are open-ended on purpose: automated providers can be added
 * later without a schema change.
 */
export const PAYMENT_METHODS = [
  "Bank transfer",
  "UPI",
  "PayPal",
  "Wise",
  "Stripe",
  "Razorpay",
  "Other",
] as const;

export const PAYOUT_EVENT_TYPES = [
  "payout_created",
  "details_requested",
  "details_submitted",
  "details_verified",
  "processing_started",
  "payment_completed",
  "payment_failed",
  "payment_cancelled",
  "retry_requested",
  "provider_webhook",
] as const;

export type PayoutEventType = (typeof PAYOUT_EVENT_TYPES)[number];

export const PAYOUT_EVENT_LABELS: Record<PayoutEventType, string> = {
  payout_created: "Payout created",
  details_requested: "Winner details requested",
  details_submitted: "Winner details submitted",
  details_verified: "Winner details verified",
  processing_started: "Payment processing started",
  payment_completed: "Payment completed",
  payment_failed: "Payment failed",
  payment_cancelled: "Payout cancelled",
  retry_requested: "Retry requested",
  provider_webhook: "Provider update",
};

export type PayoutEvent = {
  id: string;
  payoutId: string;
  actorId: string | null;
  actorName: string | null;
  /** Unknown types (future webhook events) render with a humanised fallback. */
  eventType: string;
  note: string | null;
  createdAt: string;
};

/** Shared payout shape. Sensitive fields are only populated for admins. */
export type Payout = {
  id: string;
  contestId: string;
  contestTitle: string;
  winnerId: string;
  rank: number;
  businessId: string;
  businessName: string | null;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentProvider: string;
  providerTransactionId: string | null;
  providerStatus: string | null;
  /** Admin-only. */
  internalNotes: string | null;
  failureReason: string | null;
  requestedAt: string | null;
  processingAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasDetails: boolean;
  detailsVerified: boolean;
};

export type PayoutDetails = {
  id: string;
  winnerId: string;
  influencerId: string;
  fullName: string;
  phone: string;
  email: string;
  country: string;
  bankHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string | null;
  swift: string | null;
  upiId: string | null;
  paypalEmail: string | null;
  governmentIdUrl: string | null;
  taxId: string | null;
  declarationAccepted: boolean;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

/** Influencer-facing reward row. */
export type RewardEntry = {
  payout: Payout;
  details: PayoutDetails | null;
  events: PayoutEvent[];
  needsDetails: boolean;
};

/** Aggregate progress shown to businesses (and reused by admins). */
export type PayoutProgress = {
  contestId: string;
  totalWinners: number;
  pending: number;
  processing: number;
  paid: number;
  failed: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
};

/** Terminal statuses can never be mutated again. */
export function isPayoutImmutable(status: PayoutStatus): boolean {
  return status === "paid";
}

export function canCancelPayout(status: PayoutStatus): boolean {
  return status !== "paid" && status !== "cancelled";
}

export function humaniseEventType(eventType: string): string {
  const known = PAYOUT_EVENT_LABELS[eventType as PayoutEventType];
  if (known) return known;
  return eventType.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
