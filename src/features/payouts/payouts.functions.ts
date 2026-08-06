import { createServerFn } from "@tanstack/react-start";
import type { Payout } from "./types";

/**
 * Data layer for the manual payout ledger. The contracts below are final; the
 * next milestone replaces the bodies with real queries.
 */
export const listPayouts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Payout[]> => [],
);
