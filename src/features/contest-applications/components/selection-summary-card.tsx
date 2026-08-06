import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSelectionSummary } from "../participant-selection.functions";
import { applicationKeys } from "../hooks/use-applications";
import { SelectionSummary } from "./selection-summary";

/** Aggregate-only selection progress for the contest owner. No applicant identities. */
export function SelectionSummaryCard({ contestId }: { contestId: string }) {
  const fetchSummary = useServerFn(getSelectionSummary);
  const { data } = useQuery({
    queryKey: applicationKeys.selectionSummary(contestId),
    queryFn: () => fetchSummary({ data: { contestId } }),
  });

  if (!data) return null;
  return <SelectionSummary summary={data} />;
}
