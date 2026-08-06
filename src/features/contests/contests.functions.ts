import { createServerFn } from "@tanstack/react-start";
import type { Contest, ContestWinner } from "./types";

/**
 * Data layer for contests. The contracts below are final; the next milestone
 * replaces the bodies with real queries without touching call sites.
 */
export const listOpenContests = createServerFn({ method: "GET" }).handler(
  async (): Promise<Contest[]> => [],
);

export const listMyActiveContests = createServerFn({ method: "GET" }).handler(
  async (): Promise<Contest[]> => [],
);

export const listMyCompletedContests = createServerFn({ method: "GET" }).handler(
  async (): Promise<Contest[]> => [],
);

export const listAllContests = createServerFn({ method: "GET" }).handler(
  async (): Promise<Contest[]> => [],
);

export const listMyWins = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContestWinner[]> => [],
);

export const listAllWinners = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContestWinner[]> => [],
);
