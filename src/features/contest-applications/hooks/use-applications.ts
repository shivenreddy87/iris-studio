import { useQueryClient } from "@tanstack/react-query";

export const applicationKeys = {
  all: ["contest-applications"] as const,
  mine: ["contest-applications", "mine"] as const,
  context: (contestId: string) => ["contest-applications", "context", contestId] as const,
  events: (id: string) => ["contest-applications", "events", id] as const,
  forContest: (contestId: string) => ["contest-applications", "contest", contestId] as const,
  counts: (contestId: string) => ["contest-applications", "counts", contestId] as const,
};

/** Invalidates every application surface after a mutation. */
export function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return (contestId?: string, applicationId?: string) => {
    void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    if (contestId) {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.context(contestId) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.counts(contestId) });
      void queryClient.invalidateQueries({ queryKey: ["contests", "detail", contestId] });
    }
    if (applicationId) {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.events(applicationId) });
    }
  };
}
