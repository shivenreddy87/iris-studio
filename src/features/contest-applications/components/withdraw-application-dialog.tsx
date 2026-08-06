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
import { withdrawApplication } from "../application.functions";
import type { ContestApplication } from "../types";

export function WithdrawApplicationDialog({
  application,
  onWithdrawn,
}: {
  application: ContestApplication;
  onWithdrawn: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const withdraw = useServerFn(withdrawApplication);

  const mutation = useMutation({
    mutationFn: () =>
      withdraw({ data: { applicationId: application.id, note: note.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Application withdrawn");
      setOpen(false);
      setNote("");
      onWithdrawn();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Withdraw
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw application</DialogTitle>
            <DialogDescription>
              Your application for “{application.contestTitle}” will be withdrawn. You cannot
              re-apply to this contest afterwards.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Reason (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Withdrawing…" : "Withdraw application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
