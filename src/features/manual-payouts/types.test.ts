import { describe, expect, it } from "vitest";
import {
  canCancelPayout,
  humaniseEventType,
  isPayoutImmutable,
  PAYOUT_STATUSES,
  PAYOUT_STATUS_LABELS,
} from "@/features/manual-payouts/types";

describe("payout status metadata", () => {
  it("labels every status", () => {
    for (const status of PAYOUT_STATUSES) {
      expect(PAYOUT_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("isPayoutImmutable", () => {
  it("locks paid payouts only", () => {
    expect(isPayoutImmutable("paid")).toBe(true);
    for (const status of PAYOUT_STATUSES.filter((s) => s !== "paid")) {
      expect(isPayoutImmutable(status)).toBe(false);
    }
  });
});

describe("canCancelPayout", () => {
  it("cannot cancel paid or already cancelled payouts", () => {
    expect(canCancelPayout("paid")).toBe(false);
    expect(canCancelPayout("cancelled")).toBe(false);
  });

  it("can cancel anything still in flight", () => {
    for (const status of PAYOUT_STATUSES.filter((s) => s !== "paid" && s !== "cancelled")) {
      expect(canCancelPayout(status)).toBe(true);
    }
  });
});

describe("humaniseEventType", () => {
  it("falls back to a readable label for unknown events", () => {
    expect(humaniseEventType("some_new_event")).toBe("Some new event");
  });
});
