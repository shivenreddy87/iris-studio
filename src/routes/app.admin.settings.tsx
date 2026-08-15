import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformSettingsForm } from "@/features/platform-admin/components/platform-settings-form";
import {
  CategoryManager,
  ChannelManager,
} from "@/features/platform-admin/components/taxonomy-manager";
import { AnalyticsCard } from "@/features/analytics/components/analytics-card";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { formatDate } from "@/features/analytics/chart.helpers";
import {
  usePlatformCategories,
  usePlatformChannels,
  usePlatformSettings,
  useSettingsHistory,
  useTaxonomyActions,
  useUpdateSettings,
} from "@/features/platform-admin/hooks/use-admin";

export const Route = createFileRoute("/app/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Creoinfo" },
      {
        name: "description",
        content: "Contest defaults, categories, platforms and notification defaults.",
      },
      { property: "og:title", content: "Platform Settings — Creoinfo" },
      {
        property: "og:description",
        content: "Contest defaults, categories, platforms and notification defaults.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const settings = usePlatformSettings();
  const history = useSettingsHistory();
  const categories = usePlatformCategories();
  const channels = usePlatformChannels();
  const { saveCategory, removeCategory, saveChannel, removeChannel } = useTaxonomyActions();
  const update = useUpdateSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Administration"
        title="Platform settings"
        description="Configuration is versioned — every save keeps the previous values in history."
      />

      <Tabs defaultValue="defaults">
        <TabsList>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="taxonomy">Categories & platforms</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="defaults" className="mt-6">
          <DataSection
            loading={settings.isLoading}
            error={settings.error}
            isEmpty={!settings.data}
            empty={<EmptyState title="Settings unavailable" />}
          >
            {settings.data ? (
              <PlatformSettingsForm
                settings={settings.data}
                pending={update.isPending}
                onSave={(input) => update.mutate(input)}
              />
            ) : null}
          </DataSection>
        </TabsContent>

        <TabsContent value="taxonomy" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryManager
              kind="business"
              title="Business categories"
              description="Used in campaign requests and business profiles."
              categories={categories.data}
              loading={categories.isLoading}
              error={categories.error}
              onSave={(input) => saveCategory.mutate(input)}
              onRemove={(id) => removeCategory.mutate(id)}
            />
            <CategoryManager
              kind="creator"
              title="Creator categories"
              description="Used for contest targeting and influencer niches."
              categories={categories.data}
              loading={categories.isLoading}
              error={categories.error}
              onSave={(input) => saveCategory.mutate(input)}
              onRemove={(id) => removeCategory.mutate(id)}
            />
          </div>
          <ChannelManager
            channels={channels.data}
            loading={channels.isLoading}
            error={channels.error}
            onSave={(input) => saveChannel.mutate(input)}
            onRemove={(id) => removeChannel.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AnalyticsCard title="Configuration history" description="Latest 20 versions.">
            <DataSection
              loading={history.isLoading}
              error={history.error}
              isEmpty={!history.data?.length}
              empty={<EmptyState title="No history yet" />}
            >
              <ol className="space-y-3">
                {(history.data ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-hairline bg-surface-1 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs uppercase tracking-widest text-violet">
                        v{entry.version}
                      </span>
                      <span className="text-xs text-ink-mute">{formatDate(entry.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink-dim">
                      {entry.note ?? "No change note recorded."}
                    </p>
                  </li>
                ))}
              </ol>
            </DataSection>
          </AnalyticsCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
