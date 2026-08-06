import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Ban, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { formatCurrency, formatDate } from "@/features/analytics/chart.helpers";
import type { AdminUserRow } from "../types";
import { SuspensionDialog } from "./suspension-dialog";
import { useModerationActions } from "../hooks/use-admin";

type Column = { key: string; label: string; currency?: boolean };

const BUSINESS_COLUMNS: Column[] = [
  { key: "request_count", label: "Requests" },
  { key: "contest_count", label: "Contests" },
  { key: "application_count", label: "Applications" },
  { key: "reward_distributed", label: "Rewards", currency: true },
];

const INFLUENCER_COLUMNS: Column[] = [
  { key: "application_count", label: "Applications" },
  { key: "selected_count", label: "Selected" },
  { key: "win_count", label: "Wins" },
  { key: "reward_won", label: "Rewards", currency: true },
];

export function AdminUserTable({
  role,
  rows,
  loading,
  error,
  search,
  onSearchChange,
}: {
  role: "business" | "influencer";
  rows: AdminUserRow[] | undefined;
  loading: boolean;
  error: unknown;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const columns = role === "business" ? BUSINESS_COLUMNS : INFLUENCER_COLUMNS;
  const { suspend, reactivate } = useModerationActions();
  const [target, setTarget] = useState<AdminUserRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${role === "business" ? "businesses" : "influencers"}…`}
          className="pl-9"
        />
      </div>

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!rows?.length}
        empty={
          <EmptyState
            icon={<ShieldAlert className="size-8" />}
            title="No accounts found"
            hint="Try a different search term."
          />
        }
      >
        <div className="overflow-hidden rounded-3xl border border-hairline bg-surface-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-right">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      to={
                        role === "business"
                          ? "/app/admin/businesses/$businessId"
                          : "/app/admin/influencers/$influencerId"
                      }
                      params={
                        role === "business" ? { businessId: row.id } : { influencerId: row.id }
                      }
                      className="font-semibold text-ink hover:text-violet"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-ink-mute">{row.email}</p>
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} className="text-right font-mono text-xs text-ink">
                      {column.currency
                        ? formatCurrency(row.stats[column.key] ?? 0)
                        : (row.stats[column.key] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-xs text-ink-dim">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    {row.suspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.suspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reactivate.isPending}
                        onClick={() => reactivate.mutate({ userId: row.id, role })}
                      >
                        <RotateCcw className="size-4" /> Reactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setTarget(row)}>
                        <Ban className="size-4" /> Suspend
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataSection>

      <SuspensionDialog
        user={target}
        role={role}
        pending={suspend.isPending}
        onClose={() => setTarget(null)}
        onConfirm={(reason) => {
          if (!target) return;
          suspend.mutate({ userId: target.id, role, reason }, { onSuccess: () => setTarget(null) });
        }}
      />
    </div>
  );
}
