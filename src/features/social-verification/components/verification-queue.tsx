import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  decideSocialVerification,
  listSocialVerifications,
} from "../verification.functions";
import { PLATFORM_LABELS, type PendingVerification } from "../types";
import { VerificationBadge } from "./social-accounts-panel";

type Filter = "pending" | "verified" | "rejected" | "all";

export function VerificationQueue() {
  const queryClient = useQueryClient();
  const list = useServerFn(listSocialVerifications);
  const decide = useServerFn(decideSocialVerification);
  const [filter, setFilter] = useState<Filter>("pending");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["social-verifications", filter],
    queryFn: () => list({ data: { status: filter } }),
  });

  const mutation = useMutation({
    mutationFn: (input: { accountId: string; decision: "approve" | "reject"; reason?: string }) =>
      decide({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social-verifications"] });
      toast.success("Decision recorded.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-mute">
          Check that the proof code appears in the public bio before approving.
        </p>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-full tap-target sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Awaiting review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(row: PendingVerification) => row.id}
          minWidth={820}
          empty="Nothing to review."
          columns={[
            {
              id: "owner",
              header: "Influencer",
              mobile: "title",
              cell: (row) => <span className="text-ink">{row.ownerName ?? row.ownerEmail}</span>,
            },
            {
              id: "account",
              header: "Account",
              mobile: "subtitle",
              cell: (row) => (
                <span className="text-ink-mute">
                  {PLATFORM_LABELS[row.platform] ?? row.platform} · @{row.handle}
                </span>
              ),
            },
            {
              id: "code",
              header: "Proof code",
              cell: (row) => (
                <code className="font-mono text-xs text-ink">{row.verificationCode ?? "—"}</code>
              ),
            },
            {
              id: "link",
              header: "Profile",
              cell: (row) =>
                row.profileUrl ? (
                  <a
                    className="inline-flex items-center gap-1 text-xs text-ink underline-offset-4 hover:underline"
                    href={row.profileUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-xs text-ink-mute">—</span>
                ),
            },
            {
              id: "status",
              header: "Status",
              mobile: "trailing",
              cell: (row) => <VerificationBadge status={row.status} />,
            },
          ]}
          actions={(row) =>
            row.status === "pending" ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Input
                  className="sm:w-48"
                  placeholder="Rejection reason"
                  value={reasons[row.id] ?? ""}
                  onChange={(e) => setReasons((p) => ({ ...p, [row.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({ accountId: row.id, decision: "approve" })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        accountId: row.id,
                        decision: "reject",
                        reason: reasons[row.id],
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}
