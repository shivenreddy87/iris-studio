import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getBusinessAnalytics,
  getCampaignAnalytics,
  getContestAnalytics,
  getDashboardAnalytics,
  getInfluencerAnalytics,
  getPayoutAnalytics,
  getPlatformAnalytics,
  getSubmissionAnalytics,
  getWinnerAnalytics,
} from "../analytics.functions";
import type { DateRangeKey } from "../types";

export function usePlatformAnalytics(range: DateRangeKey = "30d") {
  const fetcher = useServerFn(getPlatformAnalytics);
  return useQuery({
    queryKey: ["analytics", "platform", range],
    queryFn: () => fetcher({ data: { range } }),
  });
}

export function useCampaignAnalytics(range: DateRangeKey = "30d") {
  const fetcher = useServerFn(getCampaignAnalytics);
  return useQuery({
    queryKey: ["analytics", "campaigns", range],
    queryFn: () => fetcher({ data: { range } }),
  });
}

export function useSubmissionAnalytics(range: DateRangeKey = "30d") {
  const fetcher = useServerFn(getSubmissionAnalytics);
  return useQuery({
    queryKey: ["analytics", "submissions", range],
    queryFn: () => fetcher({ data: { range } }),
  });
}

export function useWinnerAnalytics() {
  const fetcher = useServerFn(getWinnerAnalytics);
  return useQuery({
    queryKey: ["analytics", "winners"],
    queryFn: () => fetcher(),
  });
}

export function usePayoutAnalytics(range: DateRangeKey = "30d") {
  const fetcher = useServerFn(getPayoutAnalytics);
  return useQuery({
    queryKey: ["analytics", "payouts", range],
    queryFn: () => fetcher({ data: { range } }),
  });
}

export function useBusinessAnalytics(range: DateRangeKey = "30d", enabled = true) {
  const fetcher = useServerFn(getBusinessAnalytics);
  return useQuery({
    queryKey: ["analytics", "business", range],
    queryFn: () => fetcher({ data: { range } }),
    enabled,
  });
}

export function useInfluencerAnalytics(range: DateRangeKey = "30d", enabled = true) {
  const fetcher = useServerFn(getInfluencerAnalytics);
  return useQuery({
    queryKey: ["analytics", "influencer", range],
    queryFn: () => fetcher({ data: { range } }),
    enabled,
  });
}

export function useContestAnalytics(contestId: string, enabled = true) {
  const fetcher = useServerFn(getContestAnalytics);
  return useQuery({
    queryKey: ["analytics", "contest", contestId],
    queryFn: () => fetcher({ data: { contestId } }),
    enabled: enabled && Boolean(contestId),
  });
}

export function useDashboardAnalytics(range: DateRangeKey = "30d") {
  const fetcher = useServerFn(getDashboardAnalytics);
  return useQuery({
    queryKey: ["analytics", "dashboard", range],
    queryFn: () => fetcher({ data: { range } }),
  });
}
