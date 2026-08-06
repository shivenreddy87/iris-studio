import { createServerFn } from "@tanstack/react-start";
import type { CampaignRequest } from "./types";

/**
 * Data layer for campaign requests. The contracts below are final; the next
 * milestone replaces the bodies with real queries without touching call sites.
 */
export const listCampaignRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<CampaignRequest[]> => [],
);

export const listAllCampaignRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<CampaignRequest[]> => [],
);
