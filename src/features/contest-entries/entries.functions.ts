import { createServerFn } from "@tanstack/react-start";
import type { ContestEntry } from "./types";

/**
 * Data layer for contest entries (influencer applications). The contracts below
 * are final; the next milestone replaces the bodies with real queries.
 */
export const listMyContestEntries = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContestEntry[]> => [],
);

export const listAllContestEntries = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContestEntry[]> => [],
);
