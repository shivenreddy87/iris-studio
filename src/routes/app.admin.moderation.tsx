import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/shared/page-header";
import { ModerationLog } from "@/features/platform-admin/components/moderation-log";
import { AdminUserTable } from "@/features/platform-admin/components/admin-user-table";
import { AnalyticsCard } from "@/features/analytics/components/analytics-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminBusinesses,
  useAdminInfluencers,
  useModerationRecords,
} from "@/features/platform-admin/hooks/use-admin";
import { generatePlatformReport } from "@/features/platform-admin/admin.functions";
import { ExportButton } from "@/features/analytics/components/export-button";

export const Route = createFileRoute("/app/admin/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation — Iris Studio" },
      {
        name: "description",
        content: "Suspend or reactivate accounts and review the platform moderation log.",
      },
      { property: "og:title", content: "Moderation — Iris Studio" },
      {
        property: "og:description",
        content: "Suspend or reactivate accounts and review the platform moderation log.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ModerationPage,
});

function ModerationPage() {
  const [businessSearch, setBusinessSearch] = useState("");
  const [influencerSearch, setInfluencerSearch] = useState("");
  const businesses = useAdminBusinesses(businessSearch);
  const influencers = useAdminInfluencers(influencerSearch);
  const moderation = useModerationRecords();
  const report = useServerFn(generatePlatformReport);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Administration"
        title="Moderation"
        description="Suspended accounts keep read access but cannot create new requests, applications or submissions."
        actions={
          <ExportButton
            filename="moderation-log"
            label="Export log"
            load={async () => (await report({ data: { kind: "activity" } })).rows}
          />
        }
      />

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="log">Moderation log</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="mt-6">
          <AdminUserTable
            role="business"
            rows={businesses.data}
            loading={businesses.isLoading}
            error={businesses.error}
            search={businessSearch}
            onSearchChange={setBusinessSearch}
          />
        </TabsContent>

        <TabsContent value="influencers" className="mt-6">
          <AdminUserTable
            role="influencer"
            rows={influencers.data}
            loading={influencers.isLoading}
            error={influencers.error}
            search={influencerSearch}
            onSearchChange={setInfluencerSearch}
          />
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <AnalyticsCard title="Moderation history" description="Newest actions first.">
            <ModerationLog
              records={moderation.data}
              loading={moderation.isLoading}
              error={moderation.error}
            />
          </AnalyticsCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
