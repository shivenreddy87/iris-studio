import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Archive, ArrowRight, Trash2 } from "lucide-react";
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
import { archiveContest, deleteDraftContest, transitionContest } from "../contest.functions";
import { useInvalidateContest } from "../hooks/use-contests";
import {
  CONTEST_STATUS_LABELS,
  CONTEST_TRANSITIONS,
  canDeleteContest,
  type Contest,
  type ContestStatus,
} from "../types";

/** Admin lifecycle controls. Only transitions valid for the current status are offered. */
export function ContestLifecycleActions({ contest }: { contest: Contest }) {
  const navigate = useNavigate();
  const invalidate = useInvalidateContest();
  const [archiving, setArchiving] = useState(false);
  const [note, setNote] = useState("");

  const move = useServerFn(transitionContest);
  const archive = useServerFn(archiveContest);
  const remove = useServerFn(deleteDraftContest);

  const moveMutation = useMutation({
    mutationFn: (to: ContestStatus) => move({ data: { id: contest.id, to } }),
    onSuccess: (updated) => {
      toast.success(`Contest moved to ${CONTEST_STATUS_LABELS[updated.status]}`);
      invalidate(contest.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archive({ data: { id: contest.id, note: note.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Contest archived");
      setArchiving(false);
      setNote("");
      invalidate(contest.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id: contest.id } }),
    onSuccess: () => {
      toast.success("Draft contest deleted");
      invalidate();
      void navigate({ to: "/app/admin/contests" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const next = CONTEST_TRANSITIONS[contest.status].filter((s) => s !== "archived");
  const canArchive = CONTEST_TRANSITIONS[contest.status].includes("archived");

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {contest.status === "draft" ? (
          <Button
            onClick={() =>
              void navigate({
                to: "/app/admin/contests/$contestId/edit",
                params: { contestId: contest.id },
              })
            }
          >
            Continue in wizard
          </Button>
        ) : contest.status !== "archived" && contest.status !== "completed" ? (
          <Button
            variant="secondary"
            onClick={() =>
              void navigate({
                to: "/app/admin/contests/$contestId/edit",
                params: { contestId: contest.id },
              })
            }
          >
            Edit operational details
          </Button>
        ) : null}

        {next.map((status) => (
          <Button
            key={status}
            variant="secondary"
            disabled={moveMutation.isPending}
            onClick={() => moveMutation.mutate(status)}
          >
            <ArrowRight className="size-4" /> {CONTEST_STATUS_LABELS[status]}
          </Button>
        ))}

        {canArchive ? (
          <Button variant="outline" onClick={() => setArchiving(true)}>
            <Archive className="size-4" /> Archive
          </Button>
        ) : null}

        {canDeleteContest(contest.status) ? (
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="size-4" /> Delete draft
          </Button>
        ) : null}
      </div>

      <Dialog open={archiving} onOpenChange={(open) => !open && setArchiving(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive contest</DialogTitle>
            <DialogDescription>
              Archiving retires the contest permanently. The business is notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note recorded on the timeline"
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiving(false)}>
              Cancel
            </Button>
            <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>
              Archive contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
