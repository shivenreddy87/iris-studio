import { useQueryClient } from "@tanstack/react-query";

export const applicationKeys = {
  all: ["contest-applications"] as const,
  mine: ["contest-applications", "mine"] as const,
  context: (contestId: string) => ["contest-applications", "context", contestId] as const,
  events: (id: string) => ["contest-applications", "events", id] as const,
  forContest: (contestId: string) => ["contest-applications", "contest", contestId] as const,
  counts: (contestId: string) => ["contest-applications", "counts", contestId] as const,
  detail: (id: string) => ["contest-applications", "detail", id] as const,
  participants: (contestId: string) =>
    ["contest-applications", "participants", contestId] as const,
  selectionSummary: (contestId: string) =>
    ["contest-applications", "selection-summary", contestId] as const,
};

/** Invalidates every application surface after a mutation. */
export function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return (contestId?: string, applicationId?: string) => {
    void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    if (contestId) {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.context(contestId) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.counts(contestId) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.participants(contestId) });
      void queryClient.invalidateQueries({
        queryKey: applicationKeys.selectionSummary(contestId),
      });
      void queryClient.invalidateQueries({ queryKey: ["contests", "detail", contestId] });
      void queryClient.invalidateQueries({ queryKey: ["contests", "events", contestId] });
      void queryClient.invalidateQueries({ queryKey: ["/app/contests/active"] });
    }
    if (applicationId) {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.events(applicationId) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
    }
  };
}
