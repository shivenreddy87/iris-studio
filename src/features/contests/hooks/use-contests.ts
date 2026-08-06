import { useQueryClient } from "@tanstack/react-query";

export const contestKeys = {
  all: ["contests"] as const,
  mine: ["contests", "mine"] as const,
  detail: (id: string) => ["contests", "detail", id] as const,
  events: (id: string) => ["contests", "events", id] as const,
  sources: ["contests", "approved-requests"] as const,
};

/** Invalidates every contest surface after a mutation. */
export function useInvalidateContest() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: contestKeys.all });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: contestKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: contestKeys.events(id) });
    }
  };
}
