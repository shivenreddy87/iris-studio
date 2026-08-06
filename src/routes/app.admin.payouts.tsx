import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listPayouts } from "@/features/payouts/payouts.functions";
import { PayoutList } from "@/features/payouts/components/payout-list";

export const Route = createFileRoute("/app/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Manual Payouts — Iris Studio Admin" },
      { name: "description", content: "Track reward payouts settled manually outside the platform." },
      { property: "og:title", content: "Manual Payouts — Iris Studio Admin" },
      { property: "og:description", content: "Track reward payouts settled manually outside the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayoutsPage,
});

function AdminPayoutsPage() {
  const fetchItems = useServerFn(listPayouts);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["/app/admin/payouts"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Admin" title="Manual Payouts" description="A ledger of winner rewards. Payments are settled outside the platform and recorded here." />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Wallet className="size-8" />}
            title="No payouts recorded"
            hint="Payout entries are created when winners are declared."
          />
        }
      >
        <PayoutList payouts={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Record a settled payment with reference",
          "Pending versus paid ledger view",
          "Export for finance reconciliation",
        ]}
      />
    </div>
  );
}
