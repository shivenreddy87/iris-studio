export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
};

/** Payouts are settled manually outside the platform; this record is the ledger entry. */
export type Payout = {
  id: string;
  contestId: string;
  contestTitle: string;
  influencerId: string;
  influencerName: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  reference: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayoutInput = {
  contestId: string;
  influencerId: string;
  amount: number;
  currency?: string;
  reference?: string;
  note?: string;
};
