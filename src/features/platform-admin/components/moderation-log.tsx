import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { formatDate } from "@/features/analytics/chart.helpers";
import {
  MODERATION_ACTION_LABELS,
  MODERATION_TARGET_LABELS,
  type ModerationRecord,
} from "../types";

export function ModerationLog({
  records,
  loading,
  error,
}: {
  records: ModerationRecord[] | undefined;
  loading: boolean;
  error: unknown;
}) {
  return (
    <DataSection
      loading={loading}
      error={error}
      isEmpty={!records?.length}
      empty={
        <EmptyState
          icon={<ShieldCheck className="size-8" />}
          title="No moderation activity"
          hint="Flags, suspensions and notes appear here."
        />
      }
    >
      <ol className="space-y-3">
        {(records ?? []).map((record) => (
          <li key={record.id} className="rounded-2xl border border-hairline bg-surface-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={record.action === "suspend" ? "destructive" : "secondary"}>
                  {MODERATION_ACTION_LABELS[record.action]}
                </Badge>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                  {MODERATION_TARGET_LABELS[record.targetType]}
                </span>
              </div>
              <span className="text-xs text-ink-mute">{formatDate(record.createdAt)}</span>
            </div>
            {record.reason ? <p className="mt-2 text-sm text-ink">{record.reason}</p> : null}
            {record.note ? <p className="mt-1 text-sm text-ink-dim">{record.note}</p> : null}
            <p className="mt-2 text-xs text-ink-mute">
              By {record.actorName ?? "System"} · {record.targetId.slice(0, 8)}
            </p>
          </li>
        ))}
      </ol>
    </DataSection>
  );
}
