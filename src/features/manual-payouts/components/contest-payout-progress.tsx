import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContestPayoutProgress } from "../payout.functions";
import { PayoutProgressCard } from "./payout-progress-card";

/** Fetches aggregate payout progress for a contest (business + admin views). */
export function ContestPayoutProgress({ contestId }: { contestId: string }) {
  const fetchProgress = useServerFn(getContestPayoutProgress);
  const { data } = useQuery({
    queryKey: ["contest-payout-progress", contestId],
    queryFn: () => fetchProgress({ data: { contestId } }),
  });

  if (!data) return null;
  return <PayoutProgressCard progress={data} />;
}
