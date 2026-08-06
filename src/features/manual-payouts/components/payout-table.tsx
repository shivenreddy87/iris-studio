import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Eye,
  PlayCircle,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
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
import { Field, fieldClass } from "@/features/profiles/components/field";
import {
  beginPayoutProcessing,
  cancelPayoutRecord,
  getPayoutTimeline,
  getWinnerPayoutDetails,
  markPayoutFailed,
  markPayoutPaid,
  requestPayoutDetails,
  retryPayout,
  savePayoutNotes,
  verifyPayoutDetails,
} from "../payout.functions";
import { canCancelPayout, isPayoutImmutable, PAYMENT_METHODS, type Payout } from "../types";
import { PayoutStatusBadge } from "./payout-status-badge";
import { PayoutTimeline } from "./payout-timeline";

function money(payout: Payout) {
  return `${payout.currency} ${payout.amount.toLocaleString()}`;
}

/** Admin ledger: bulk actions on the left, per-payout drawer on the right. */
export function PayoutTable({ payouts }: { payouts: Payout[] }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<Payout | null>(null);

  const requestDetails = useServerFn(requestPayoutDetails);
  const beginProcessing = useServerFn(beginPayoutProcessing);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });

  const bulkRequest = useMutation({
    mutationFn: () => requestDetails({ data: { payoutIds: selected } }),
    onSuccess: (result) => {
      toast.success(`Requested details for ${result.updated} winner(s).`);
      setSelected([]);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const bulkProcess = useMutation({
    mutationFn: () => beginProcessing({ data: { payoutIds: selected } }),
    onSuccess: (result) => {
      toast.success(`${result.updated} payout(s) moved to processing.`);
      setSelected([]);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectable = payouts.filter((p) => !isPayoutImmutable(p.status));
  const allSelected = selectable.length > 0 && selected.length === selectable.length;

  return (
    <div className="space-y-4">
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet/40 bg-violet/10 px-4 py-3">
          <span className="text-sm text-ink">{selected.length} selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bulkRequest.mutate()}
            disabled={bulkRequest.isPending}
          >
            <Send className="mr-2 size-3.5" /> Request details
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bulkProcess.mutate()}
            disabled={bulkProcess.isPending}
          >
            <PlayCircle className="mr-2 size-3.5" /> Start processing
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-hairline bg-surface-2">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-hairline text-[10px] uppercase tracking-widest text-ink-mute">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all payouts"
                  checked={allSelected}
                  onChange={(e) => setSelected(e.target.checked ? selectable.map((p) => p.id) : [])}
                />
              </th>
              <th className="px-4 py-3">Winner</th>
              <th className="px-4 py-3">Contest</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-hairline/60 last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Select payout for ${payout.influencerName ?? "winner"}`}
                    disabled={isPayoutImmutable(payout.status)}
                    checked={selected.includes(payout.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, payout.id]
                          : prev.filter((id) => id !== payout.id),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{payout.influencerName ?? "Influencer"}</p>
                  <p className="text-xs text-ink-mute">
                    {payout.influencerHandle ? `@${payout.influencerHandle} · ` : ""}Rank #
                    {payout.rank}
                  </p>
                </td>
                <td className="px-4 py-3 text-ink-dim">{payout.contestTitle}</td>
                <td className="px-4 py-3 font-mono text-ink">{money(payout)}</td>
                <td className="px-4 py-3">
                  {payout.detailsVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  ) : payout.hasDetails ? (
                    <span className="text-xs text-amber-300">Submitted</span>
                  ) : (
                    <span className="text-xs text-ink-mute">Missing</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PayoutStatusBadge status={payout.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setActive(payout)}>
                    <Eye className="mr-2 size-3.5" /> Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active ? (
        <PayoutDrawer payout={active} onClose={() => setActive(null)} onChanged={invalidate} />
      ) : null}
    </div>
  );
}

function PayoutDrawer({
  payout,
  onClose,
  onChanged,
}: {
  payout: Payout;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState(payout.internalNotes ?? "");
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");

  const fetchTimeline = useServerFn(getPayoutTimeline);
  const fetchDetails = useServerFn(getWinnerPayoutDetails);

  const timeline = useQuery({
    queryKey: ["payout-timeline", payout.id],
    queryFn: () => fetchTimeline({ data: { payoutId: payout.id } }),
  });
  const details = useQuery({
    queryKey: ["payout-details", payout.winnerId],
    queryFn: () => fetchDetails({ data: { winnerId: payout.winnerId } }),
  });

  const verify = useServerFn(verifyPayoutDetails);
  const process = useServerFn(beginPayoutProcessing);
  const paid = useServerFn(markPayoutPaid);
  const failed = useServerFn(markPayoutFailed);
  const retry = useServerFn(retryPayout);
  const cancel = useServerFn(cancelPayoutRecord);
  const saveNotes = useServerFn(savePayoutNotes);

  function run<T>(promise: Promise<T>, message: string) {
    promise
      .then(() => {
        toast.success(message);
        onChanged();
        void timeline.refetch();
        void details.refetch();
      })
      .catch((error: Error) => toast.error(error.message));
  }

  const locked = isPayoutImmutable(payout.status);

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {payout.influencerName ?? "Winner"} · {money(payout)}
          </DialogTitle>
          <DialogDescription>
            {payout.contestTitle} · rank #{payout.rank}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <PayoutStatusBadge status={payout.status} />
            {payout.paymentReference ? (
              <span className="font-mono text-xs text-ink-mute">ref {payout.paymentReference}</span>
            ) : null}
          </div>

          <section className="rounded-2xl border border-hairline bg-surface-3 p-4">
            <h4 className="font-display text-sm font-semibold text-ink">Winner payment details</h4>
            {details.data ? (
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["Name", details.data.fullName],
                  ["Country", details.data.country],
                  ["Phone", details.data.phone],
                  ["Email", details.data.email],
                  ["Account holder", details.data.bankHolderName],
                  ["Bank", details.data.bankName],
                  ["Account number", details.data.accountNumber],
                  ["IFSC", details.data.ifsc ?? "—"],
                  ["SWIFT", details.data.swift ?? "—"],
                  ["UPI", details.data.upiId ?? "—"],
                  ["PayPal", details.data.paypalEmail ?? "—"],
                  ["Tax ID", details.data.taxId ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
                    <dd className="text-ink-dim">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-mute">
                The winner has not submitted payment details yet.
              </p>
            )}
            {details.data && !details.data.verifiedAt && !locked ? (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => run(verify({ data: { payoutId: payout.id } }), "Details verified.")}
              >
                <BadgeCheck className="mr-2 size-3.5" /> Verify details
              </Button>
            ) : null}
          </section>

          {!locked ? (
            <section className="space-y-4 rounded-2xl border border-hairline bg-surface-3 p-4">
              <h4 className="font-display text-sm font-semibold text-ink">Record payment</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Payment method" htmlFor="method">
                  <select
                    id="method"
                    className={fieldClass}
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Transaction reference" htmlFor="reference">
                  <input
                    id="reference"
                    className={fieldClass}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="UTR / transaction ID"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                {payout.status !== "processing" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      run(
                        process({ data: { payoutIds: [payout.id] } }),
                        "Payout moved to processing.",
                      )
                    }
                  >
                    <PlayCircle className="mr-2 size-3.5" /> Start processing
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  disabled={payout.status !== "processing" || reference.trim().length < 2}
                  onClick={() =>
                    run(
                      paid({
                        data: {
                          payoutId: payout.id,
                          paymentMethod: method,
                          paymentReference: reference.trim(),
                        },
                      }),
                      "Payout marked as paid.",
                    )
                  }
                >
                  <CheckCircle2 className="mr-2 size-3.5" /> Mark as paid
                </Button>
                {payout.status === "failed" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      run(retry({ data: { payoutId: payout.id } }), "Retrying payment.")
                    }
                  >
                    <RefreshCw className="mr-2 size-3.5" /> Retry
                  </Button>
                ) : null}
              </div>

              <Field label="Failure reason" htmlFor="failure" optional>
                <input
                  id="failure"
                  className={fieldClass}
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Bank rejected the transfer"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={payout.status !== "processing" || failureReason.trim().length < 3}
                  onClick={() =>
                    run(
                      failed({
                        data: { payoutId: payout.id, failureReason: failureReason.trim() },
                      }),
                      "Payout marked as failed.",
                    )
                  }
                >
                  <XCircle className="mr-2 size-3.5" /> Mark as failed
                </Button>
                {canCancelPayout(payout.status) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      run(cancel({ data: { payoutId: payout.id } }), "Payout cancelled.")
                    }
                  >
                    <Ban className="mr-2 size-3.5" /> Cancel payout
                  </Button>
                ) : null}
              </div>
            </section>
          ) : (
            <p className="rounded-2xl border border-hairline bg-surface-3 p-4 text-sm text-ink-mute">
              This payout has been paid and is now locked.
            </p>
          )}

          <section className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-ink">Internal notes</h4>
            <Textarea
              rows={3}
              className={fieldClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visible to admins only"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={locked}
              onClick={() =>
                run(
                  saveNotes({ data: { payoutId: payout.id, internalNotes: notes } }),
                  "Notes saved.",
                )
              }
            >
              Save notes
            </Button>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-ink">Payout timeline</h4>
            <PayoutTimeline events={timeline.data ?? []} />
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
