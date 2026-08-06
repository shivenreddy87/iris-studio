import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/features/contests/components/detail-row";
import type { Contest } from "@/features/contests/types";
import { listContestApplications } from "../application.functions";
import {
  bulkRejectApplications,
  getSelectionSummary,
  listSelectedParticipants,
} from "../participant-selection.functions";
import { applicationKeys, useInvalidateApplications } from "../hooks/use-applications";
import { ActivateContestDialog } from "./activate-contest-dialog";
import { ApplicationSelectionCard } from "./application-selection-card";
import { SelectedParticipantCard } from "./selected-participant-card";
import { SelectionSummary } from "./selection-summary";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type ContestApplication,
} from "../types";

type StatusFilter = "all" | ApplicationStatus;
type SortKey = "recent" | "followers" | "name";

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "submitted",
  "shortlisted",
  "selected",
  "rejected",
  "withdrawn",
];

/** Admin workspace for reviewing applicants and selecting contest participants. */
export function ParticipantSelectionTable({ contest }: { contest: Contest }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [checked, setChecked] = useState<string[]>([]);
  const invalidate = useInvalidateApplications();

  const loadApplications = useServerFn(listContestApplications);
  const loadParticipants = useServerFn(listSelectedParticipants);
  const loadSummary = useServerFn(getSelectionSummary);
  const bulkReject = useServerFn(bulkRejectApplications);

  const applicationsQuery = useQuery({
    queryKey: applicationKeys.forContest(contest.id),
    queryFn: () => loadApplications({ data: { contestId: contest.id } }),
  });
  const participantsQuery = useQuery({
    queryKey: applicationKeys.participants(contest.id),
    queryFn: () => loadParticipants({ data: { contestId: contest.id } }),
  });
  const summaryQuery = useQuery({
    queryKey: applicationKeys.selectionSummary(contest.id),
    queryFn: () => loadSummary({ data: { contestId: contest.id } }),
  });

  const refresh = () => {
    setChecked([]);
    invalidate(contest.id);
  };

  const bulkMutation = useMutation({
    mutationFn: () => bulkReject({ data: { contestId: contest.id, applicationIds: checked } }),
    onSuccess: (result) => {
      toast.success(
        `${result.rejected} applicant${result.rejected === 1 ? "" : "s"} rejected` +
          (result.failed > 0 ? ` · ${result.failed} could not be updated` : ""),
      );
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const applications = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (applicationsQuery.data ?? []).filter((application: ContestApplication) => {
      if (status !== "all" && application.status !== status) return false;
      if (!term) return true;
      return [
        application.influencerName,
        application.influencerHandle,
        application.influencerNiche,
        application.contentIdea,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    return [...rows].sort((a, b) => {
      if (sort === "followers") return (b.influencerFollowers ?? 0) - (a.influencerFollowers ?? 0);
      if (sort === "name") {
        return (a.influencerName ?? "").localeCompare(b.influencerName ?? "");
      }
      return b.submittedAt.localeCompare(a.submittedAt);
    });
  }, [applicationsQuery.data, search, sort, status]);

  const summary = summaryQuery.data;
  const selectable =
    contest.status === "applications_closed" || contest.status === "participant_selection";
  const canSelect = Boolean(summary?.canSelect);
  const rejectable = applications.filter(
    (a) => a.status === "submitted" || a.status === "shortlisted",
  );
  const allChecked = rejectable.length > 0 && checked.length === rejectable.length;

  return (
    <div className="space-y-6">
      {summary ? (
        <SelectionSummary
          summary={summary}
          actions={
            summary.canActivate || contest.status === "applications_closed" ? (
              <ActivateContestDialog
                contestId={contest.id}
                contestTitle={contest.title}
                selectedCount={summary.selectedCount}
                participantLimit={summary.participantLimit}
                disabled={summary.selectedCount === 0}
                onActivated={refresh}
              />
            ) : null
          }
        />
      ) : null}

      <Panel title="Applicants">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search name, handle or idea"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "all" ? "All statuses" : APPLICATION_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="followers">Most followers</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          {selectable && rejectable.length > 0 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChecked(allChecked ? [] : rejectable.map((a) => a.id))}
              >
                {allChecked ? "Clear selection" : "Select all remaining"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={checked.length === 0 || bulkMutation.isPending}
                onClick={() => bulkMutation.mutate()}
              >
                Reject {checked.length > 0 ? `${checked.length} ` : ""}selected
              </Button>
            </>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {applicationsQuery.isPending ? (
            <p className="text-sm text-ink-mute">Loading applicants…</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-ink-mute">No applicants match these filters.</p>
          ) : (
            applications.map((application) => (
              <ApplicationSelectionCard
                key={application.id}
                application={application}
                canSelect={canSelect}
                selectable={selectable}
                checked={checked.includes(application.id)}
                onCheckedChange={(next) =>
                  setChecked((current) =>
                    next
                      ? [...current, application.id]
                      : current.filter((id) => id !== application.id),
                  )
                }
                onChanged={refresh}
              />
            ))
          )}
        </div>
      </Panel>

      <Panel title="Selected participants">
        {participantsQuery.isPending ? (
          <p className="text-sm text-ink-mute">Loading participants…</p>
        ) : (participantsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-mute">No participants have been selected yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(participantsQuery.data ?? []).map((participant) => (
              <SelectedParticipantCard key={participant.id} participant={participant} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
