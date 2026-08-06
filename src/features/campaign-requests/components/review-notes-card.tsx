import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addInternalNote } from "../admin-review.functions";
import type { CampaignRequestEvent } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Admin-only internal notes: never shown to the business. */
export function ReviewNotesCard({
  requestId,
  events,
}: {
  requestId: string;
  events: CampaignRequestEvent[];
}) {
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const submitNote = useServerFn(addInternalNote);

  const mutation = useMutation({
    mutationFn: () => submitNote({ data: { id: requestId, note } }),
    onSuccess: () => {
      setNote("");
      toast.success("Note added");
      void queryClient.invalidateQueries({ queryKey: ["campaign-request-events", requestId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const notes = events.filter((event) => event.kind === "note");

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <Lock className="size-4 text-ink-mute" /> Internal notes
      </h3>
      <p className="mb-4 text-xs text-ink-mute">Visible to admins only.</p>

      {notes.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {notes.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-hairline bg-surface-3 p-3">
              <p className="whitespace-pre-wrap text-sm text-ink">{entry.note}</p>
              <p className="mt-1 text-xs text-ink-mute">
                {formatWhen(entry.createdAt)}
                {entry.actorName ? ` · ${entry.actorName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-ink-mute">No internal notes yet.</p>
      )}

      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a note for the review team"
        rows={3}
      />
      <Button
        className="mt-3"
        disabled={mutation.isPending || note.trim() === ""}
        onClick={() => mutation.mutate()}
      >
        Add note
      </Button>
    </div>
  );
}
