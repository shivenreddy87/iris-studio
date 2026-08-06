import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitMyPayoutDetails } from "../payout.functions";
import type { RewardEntry } from "../types";
import { PayoutStatusBadge } from "./payout-status-badge";
import { PayoutTimeline } from "./payout-timeline";
import { WinnerDetailsForm } from "./winner-details-form";

/** Influencer-facing reward record with details capture and live status. */
export function RewardCard({ entry, userId }: { entry: RewardEntry; userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(entry.needsDetails);
  const submit = useServerFn(submitMyPayoutDetails);

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      toast.success("Payout details submitted.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["my-rewards"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { payout } = entry;

  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-violet" />
            <h3 className="font-display text-base font-semibold text-ink">
              {payout.contestTitle}
            </h3>
          </div>
          <p className="mt-1 text-sm text-ink-mute">
            Rank #{payout.rank} · {payout.currency} {payout.amount.toLocaleString()}
          </p>
        </div>
        <PayoutStatusBadge status={payout.status} />
      </div>

      {payout.status === "paid" ? (
        <p className="mt-4 rounded-2xl border border-hairline bg-surface-3 p-4 text-sm text-ink-dim">
          Paid via {payout.paymentMethod ?? "manual transfer"}
          {payout.paymentReference ? ` · reference ${payout.paymentReference}` : ""}.
        </p>
      ) : null}

      {payout.status === "failed" && payout.failureReason ? (
        <p className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-ink-dim">
          {payout.failureReason}
        </p>
      ) : null}

      {entry.details ? (
        <p className="mt-4 text-sm text-ink-mute">
          Payment details submitted on{" "}
          {new Date(entry.details.submittedAt).toLocaleDateString()}
          {entry.details.verifiedAt ? " · verified" : " · awaiting verification"}.
        </p>
      ) : entry.needsDetails ? (
        <div className="mt-4">
          {open ? (
            <WinnerDetailsForm
              winnerId={payout.winnerId}
              userId={userId}
              submitting={mutation.isPending}
              onSubmit={async (values) => {
                await mutation.mutateAsync({ data: values });
              }}
            />
          ) : (
            <Button onClick={() => setOpen(true)}>Add payout details</Button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-mute">
          The payouts team will request your payment details shortly.
        </p>
      )}

      <div className="mt-6 border-t border-hairline pt-5">
        <h4 className="font-display text-sm font-semibold text-ink">Payout timeline</h4>
        <div className="mt-3">
          <PayoutTimeline events={entry.events} />
        </div>
      </div>
    </article>
  );
}
