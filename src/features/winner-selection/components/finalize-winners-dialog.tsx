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
import { finalizeWinners } from "../winner.functions";
import type { EvaluationBoard } from "../types";

/** Final, irreversible step: locks the winners and completes the contest. */
export function FinalizeWinnersDialog({
  board,
  onFinalized,
}: {
  board: EvaluationBoard;
  onFinalized: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const finalize = useServerFn(finalizeWinners);

  const mutation = useMutation({
    mutationFn: () =>
      finalize({ data: { contestId: board.contest.id, note: note.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Winners finalized. The contest is now completed.");
      setOpen(false);
      setNote("");
      onFinalized();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const ready = board.winnerCount > 0 && board.winnersSelected === board.winnerCount;

  return (
    <>
      <Button size="sm" disabled={!ready} onClick={() => setOpen(true)}>
        Finalize winners
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize winners</DialogTitle>
            <DialogDescription>
              This completes “{board.contest.title}” with {board.winnersSelected} winner
              {board.winnersSelected === 1 ? "" : "s"}. Metrics, rankings and winners are frozen
              afterwards and cannot be changed. Winners and participants are notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={note}
            placeholder="Closing note (optional)"
            onChange={(event) => setNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Finalizing…" : "Finalize and complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
