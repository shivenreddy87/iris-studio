import { useQueryClient } from "@tanstack/react-query";

export const submissionKeys = {
  all: ["contest-submissions"] as const,
  executions: (scope: "active" | "completed") =>
    ["contest-submissions", "executions", scope] as const,
  execution: (contestId: string) => ["contest-submissions", "execution", contestId] as const,
  forContest: (contestId: string) => ["contest-submissions", "contest", contestId] as const,
  progress: (contestId: string) => ["contest-submissions", "progress", contestId] as const,
  events: (submissionId: string) => ["contest-submissions", "events", submissionId] as const,
};

/** Refreshes every submission surface after a mutation. */
export function useInvalidateSubmissions() {
  const queryClient = useQueryClient();
  return (contestId?: string, submissionId?: string) => {
    void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    if (contestId) {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.execution(contestId) });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.forContest(contestId) });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.progress(contestId) });
    }
    if (submissionId) {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.events(submissionId) });
    }
  };
}
