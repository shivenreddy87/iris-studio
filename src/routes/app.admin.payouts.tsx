import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { fieldClass } from "@/features/profiles/components/field";
import { listPayouts } from "@/features/manual-payouts/payout.functions";
import { PayoutTable } from "@/features/manual-payouts/components/payout-table";
import {
  PAYOUT_STATUSES,
  PAYOUT_STATUS_LABELS,
  type Payout,
  type PayoutStatus,
} from "@/features/manual-payouts/types";

export const Route = createFileRoute("/app/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Reward Payouts — Creoinfo Admin" },
      {
        name: "description",
        content: "Record, track and audit every manual winner reward payout.",
      },
      { property: "og:title", content: "Reward Payouts — Creoinfo Admin" },
      {
        property: "og:description",
        content: "Record, track and audit every manual winner reward payout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayoutsPage,
});

function summarise(payouts: Payout[]) {
  const total = payouts.reduce((sum, p) => sum + p.amount, 0);
  const paidRows = payouts.filter((p) => p.status === "paid");
  return [
    { label: "Payouts", value: String(payouts.length) },
    {
      label: "Awaiting action",
      value: String(
        payouts.filter((p) =>
          ["pending", "details_requested", "waiting_for_details"].includes(p.status),
        ).length,
      ),
    },
    { label: "Processing", value: String(payouts.filter((p) => p.status === "processing").length) },
    { label: "Paid", value: String(paidRows.length) },
    {
      label: "Value settled",
      value: `${paidRows.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} / ${total.toLocaleString()}`,
    },
  ];
}

function AdminPayoutsPage() {
  const [status, setStatus] = useState<PayoutStatus | "">("");
  const [search, setSearch] = useState("");

  const fetchItems = useServerFn(listPayouts);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-payouts", status, search],
    queryFn: () =>
      fetchItems({
        data: {
          ...(status ? { status } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Reward Payouts"
        description="Winner rewards are paid outside the platform. Record every payment here to keep a complete audit trail."
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summarise(data).map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-hairline bg-surface-2 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {stat.label}
            </dt>
            <dd className="mt-1 font-display text-lg font-semibold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className={`${fieldClass} max-w-xs`}
          placeholder="Search winner, contest or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search payouts"
        />
        <select
          className={`${fieldClass} max-w-[220px]`}
          value={status}
          onChange={(e) => setStatus(e.target.value as PayoutStatus | "")}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {PAYOUT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PAYOUT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Wallet className="size-8" />}
            title="No payouts found"
            hint="Payouts are created automatically when contest winners are finalized."
          />
        }
      >
        <PayoutTable payouts={data} />
      </DataSection>
    </div>
  );
}
