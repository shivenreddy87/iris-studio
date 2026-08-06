import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users } from "lucide-react";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Panel } from "@/features/contests/components/detail-row";
import { listContestApplications } from "../application.functions";
import { applicationKeys } from "../hooks/use-applications";
import { ApplicantRow } from "./application-card";
import { APPLICATION_STATUS_LABELS, ACTIVE_APPLICATION_STATUSES, type ApplicationStatus } from "../types";

const FILTERS: (ApplicationStatus | "all")[] = ["all", ...ACTIVE_APPLICATION_STATUSES];

/** Admin read-only applicant list. Participant selection lands in the next milestone. */
export function AdminApplicationsPanel({ contestId }: { contestId: string }) {
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const fetchApplications = useServerFn(listContestApplications);

  const { data = [], isLoading, error } = useQuery({
    queryKey: [...applicationKeys.forContest(contestId), status],
    queryFn: () => fetchApplications({ data: { contestId, status } }),
  });

  return (
    <Panel title="Applications">
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
              status === option
                ? "border-violet/40 bg-violet/15 text-violet"
                : "border-hairline text-ink-mute hover:text-ink"
            }`}
          >
            {option === "all" ? "All" : APPLICATION_STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Users className="size-8" />}
            title="No applications yet"
            hint="Applications appear here as soon as influencers apply."
          />
        }
      >
        <div className="space-y-4">
          {data.map((application) => (
            <ApplicantRow key={application.id} application={application} />
          ))}
        </div>
      </DataSection>
    </Panel>
  );
}
