import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
import { flagSubmission, verifySubmission } from "../submission.functions";
import type { ContestSubmission, ReviewStatus } from "../types";

const COPY: Record<ReviewStatus, { action: string; title: string; description: string }> = {
  verified: {
    action: "Verify",
    title: "Verify submission",
    description:
      "Confirm this content meets the contest brief. The influencer and the business are notified.",
  },
  flagged: {
    action: "Flag",
    title: "Flag submission",
    description:
      "Flag this content for follow-up. Add a note explaining what needs attention — the influencer will see it.",
  },
};

/** Admin decision on a single submission. Decisions are recorded on the timeline. */
export function SubmissionReviewDialog({
  submission,
  decision,
  onReviewed,
}: {
  submission: ContestSubmission;
  decision: ReviewStatus;
  onReviewed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const verify = useServerFn(verifySubmission);
  const flag = useServerFn(flagSubmission);
  const copy = COPY[decision];

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { data: { submissionId: submission.id, note: note.trim() || undefined } };
      return decision === "verified" ? verify(payload) : flag(payload);
    },
    onSuccess: () => {
      toast.success(decision === "verified" ? "Submission verified" : "Submission flagged");
      setOpen(false);
      setNote("");
      onReviewed();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button
        size="sm"
        variant={decision === "verified" ? "default" : "ghost"}
        onClick={() => setOpen(true)}
      >
        {copy.action}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder={decision === "flagged" ? "What needs attention?" : "Note (optional)"}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : copy.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
