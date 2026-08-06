import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveRequest,
  rejectRequest,
  requestChanges,
  startReview,
} from "../admin-review.functions";
import { ADMIN_TRANSITIONS, type CampaignRequest } from "../types";

type Decision = "approved" | "rejected" | "changes_requested";

const DECISION_COPY: Record<
  Decision,
  { title: string; description: string; cta: string; placeholder: string; required: boolean }
> = {
  approved: {
    title: "Approve request",
    description: "The business is notified and the request becomes eligible for a contest.",
    cta: "Approve",
    placeholder: "Optional note shared with the business",
    required: false,
  },
  rejected: {
    title: "Reject request",
    description: "The business is notified with the reason you provide.",
    cta: "Reject",
    placeholder: "Why is this request being rejected?",
    required: true,
  },
  changes_requested: {
    title: "Request changes",
    description: "The business can edit and resubmit the request.",
    cta: "Request changes",
    placeholder: "What should the business change?",
    required: true,
  },
};

/** Admin decision buttons; only transitions valid for the current status are offered. */
export function ApprovalActions({ request }: { request: CampaignRequest }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");

  const begin = useServerFn(startReview);
  const approve = useServerFn(approveRequest);
  const reject = useServerFn(rejectRequest);
  const change = useServerFn(requestChanges);

  const allowed = ADMIN_TRANSITIONS[request.status];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["campaign-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["campaign-request-events", request.id] });
    void queryClient.invalidateQueries({ queryKey: ["admin-review-summary"] });
  };

  const startMutation = useMutation({
    mutationFn: () => begin({ data: { id: request.id } }),
    onSuccess: () => {
      toast.success("Review started");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const decideMutation = useMutation({
    mutationFn: async (input: { decision: Decision; reason: string }) => {
      const payload = { data: { id: request.id, reason: input.reason.trim() } };
      if (input.decision === "approved") return approve(payload);
      if (input.decision === "rejected") return reject(payload);
      return change(payload);
    },
    onSuccess: (_data, variables) => {
      toast.success(
        DECISION_COPY[variables.decision].title.replace("Request changes", "Changes requested"),
      );
      setDecision(null);
      setReason("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-ink-mute">
        No further review actions are available for this request.
      </p>
    );
  }

  const copy = decision ? DECISION_COPY[decision] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.includes("under_review") ? (
          <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            <PlayCircle className="size-4" /> Start review
          </Button>
        ) : null}
        {allowed.includes("approved") ? (
          <Button onClick={() => setDecision("approved")}>
            <CheckCircle2 className="size-4" /> Approve
          </Button>
        ) : null}
        {allowed.includes("changes_requested") ? (
          <Button variant="secondary" onClick={() => setDecision("changes_requested")}>
            <RefreshCw className="size-4" /> Request changes
          </Button>
        ) : null}
        {allowed.includes("rejected") ? (
          <Button variant="destructive" onClick={() => setDecision("rejected")}>
            <XCircle className="size-4" /> Reject
          </Button>
        ) : null}
      </div>

      <Dialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.description}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={copy?.placeholder}
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                decideMutation.isPending || (copy?.required === true && reason.trim() === "")
              }
              onClick={() => decision && decideMutation.mutate({ decision, reason })}
            >
              {copy?.cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
