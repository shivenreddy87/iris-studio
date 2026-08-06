import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AnalyticsCard } from "@/features/analytics/components/analytics-card";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import type { PlatformCategory, PlatformChannel } from "../types";

type Row = { id: string; name: string; isActive: boolean };

function TaxonomyList({
  rows,
  onToggle,
  onRemove,
}: {
  rows: Row[];
  onToggle: (id: string, isActive: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-1 px-4 py-3"
        >
          <span className={`text-sm ${row.isActive ? "text-ink" : "text-ink-mute line-through"}`}>
            {row.name}
          </span>
          <div className="flex items-center gap-3">
            <Switch
              checked={row.isActive}
              onCheckedChange={(checked) => onToggle(row.id, checked)}
            />
            <Button size="icon" variant="ghost" onClick={() => onRemove(row.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AddRow({ label, onAdd }: { label: string; onAdd: (name: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={label}
      />
      <Button type="submit" variant="outline">
        <Plus className="size-4" /> Add
      </Button>
    </form>
  );
}

export function CategoryManager({
  kind,
  title,
  description,
  categories,
  loading,
  error,
  onSave,
  onRemove,
}: {
  kind: "business" | "creator";
  title: string;
  description: string;
  categories: PlatformCategory[] | undefined;
  loading: boolean;
  error: unknown;
  onSave: (input: {
    id?: string;
    kind: "business" | "creator";
    name?: string;
    isActive?: boolean;
  }) => void;
  onRemove: (id: string) => void;
}) {
  const rows = (categories ?? []).filter((category) => category.kind === kind);
  return (
    <AnalyticsCard title={title} description={description}>
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!rows.length}
        empty={<EmptyState title="No categories yet" hint="Add the first one below." />}
      >
        <TaxonomyList
          rows={rows}
          onToggle={(id, isActive) => onSave({ id, kind, isActive })}
          onRemove={onRemove}
        />
      </DataSection>
      <AddRow label="New category name" onAdd={(name) => onSave({ kind, name })} />
    </AnalyticsCard>
  );
}

export function ChannelManager({
  channels,
  loading,
  error,
  onSave,
  onRemove,
}: {
  channels: PlatformChannel[] | undefined;
  loading: boolean;
  error: unknown;
  onSave: (input: { id?: string; name?: string; isActive?: boolean }) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <AnalyticsCard
      title="Social platforms"
      description="Channels available for contest targeting and content submissions."
    >
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!channels?.length}
        empty={<EmptyState title="No platforms yet" hint="Add the first one below." />}
      >
        <TaxonomyList
          rows={channels ?? []}
          onToggle={(id, isActive) => onSave({ id, isActive })}
          onRemove={onRemove}
        />
      </DataSection>
      <AddRow label="New platform name" onAdd={(name) => onSave({ name })} />
    </AnalyticsCard>
  );
}
