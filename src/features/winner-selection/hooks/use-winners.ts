import { useQueryClient } from "@tanstack/react-query";

export const winnerKeys = {
  all: ["winner-selection"] as const,
  board: (contestId: string) => ["winner-selection", "board", contestId] as const,
  results: (contestId: string) => ["winner-selection", "results", contestId] as const,
  winners: (contestId: string) => ["winner-selection", "winners", contestId] as const,
  events: (contestId: string) => ["winner-selection", "events", contestId] as const,
  myWins: ["winner-selection", "my-wins"] as const,
  myOutcome: (contestId: string) => ["winner-selection", "outcome", contestId] as const,
  myMetrics: (contestId: string) => ["winner-selection", "my-metrics", contestId] as const,
};

/** Refreshes every winner and results surface after a mutation. */
export function useInvalidateWinners() {
  const queryClient = useQueryClient();
  return (contestId?: string) => {
    void queryClient.invalidateQueries({ queryKey: winnerKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["contests"] });
    void queryClient.invalidateQueries({ queryKey: ["contest-submissions"] });
    if (contestId) {
      void queryClient.invalidateQueries({ queryKey: winnerKeys.board(contestId) });
      void queryClient.invalidateQueries({ queryKey: winnerKeys.results(contestId) });
    }
  };
}
