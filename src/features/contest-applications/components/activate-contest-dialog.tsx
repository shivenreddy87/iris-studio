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
import { activateContest } from "../participant-selection.functions";

/** Irreversible activation: moves the contest to Live and notifies everyone. */
export function ActivateContestDialog({
  contestId,
  contestTitle,
  selectedCount,
  participantLimit,
  disabled,
  onActivated,
}: {
  contestId: string;
  contestTitle: string;
  selectedCount: number;
  participantLimit: number | null;
  disabled?: boolean;
  onActivated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const activate = useServerFn(activateContest);

  const mutation = useMutation({
    mutationFn: () => activate({ data: { contestId, note: note.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Contest activated");
      setOpen(false);
      setNote("");
      onActivated();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        Activate Contest
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate “{contestTitle}”</DialogTitle>
            <DialogDescription>
              {selectedCount} participant{selectedCount === 1 ? "" : "s"}
              {participantLimit === null ? "" : ` of ${participantLimit}`} will start this contest.
              Activation cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Note for the contest history (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Activating…" : "Activate contest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
