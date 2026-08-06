import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WinnerCard } from "@/features/winner-selection/components/winner-card";
import type { ContestWinnerEntry } from "@/features/winner-selection/types";

/** Shared winner list used by the influencer "Won Contests" and admin winners views. */
export function ContestWinnerList({
  winners,
  showContest = true,
}: {
  winners: ContestWinnerEntry[];
  showContest?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {winners.map((winner) => (
        <div key={winner.id} className="space-y-2">
          <WinnerCard winner={winner} showContest={showContest} />
          <Button size="sm" variant="ghost" asChild>
            <Link to="/app/results/$contestId" params={{ contestId: winner.contestId }}>
              View result
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
