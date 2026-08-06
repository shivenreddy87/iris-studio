import { ContestCard } from "./contest-card";
import type { Contest } from "../types";

export { ContestStatusBadge } from "./contest-status-badge";

export function ContestList({
  contests,
  to = "admin",
}: {
  contests: Contest[];
  to?: "admin" | "business";
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {contests.map((contest) => (
        <ContestCard key={contest.id} contest={contest} to={to} />
      ))}
    </div>
  );
}
