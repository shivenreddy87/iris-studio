import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Instagram, Link2Off, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disconnectInstagram,
  getInstagramStatus,
  refreshInstagramData,
  startInstagramLink,
} from "../instagram/instagram.functions";

const nf = new Intl.NumberFormat("en-IN");

function when(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InstagramConnectCard() {
  const queryClient = useQueryClient();
  const status = useServerFn(getInstagramStatus);
  const startLink = useServerFn(startInstagramLink);
  const refreshFn = useServerFn(refreshInstagramData);
  const disconnectFn = useServerFn(disconnectInstagram);

  const { data, isLoading } = useQuery({
    queryKey: ["instagram-status"],
    queryFn: () => status(),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["instagram-status"] });
    await queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
  };

  const connect = useMutation({
    mutationFn: () => startLink(),
    onSuccess: (result: { url: string }) => {
      window.location.href = result.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: async () => {
      await invalidate();
      toast.success("Instagram data refreshed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectFn({ data: {} }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Instagram disconnected.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-3xl border border-hairline bg-surface-2 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet/15 text-violet">
          <Instagram className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">Instagram</h2>
          <p className="mt-1 text-sm text-ink-mute">
            Connect once and your username, picture and follower count stay up to date
            automatically — no manual review needed. We only ever read your data.
          </p>

          {isLoading ? (
            <p className="mt-4 text-sm text-ink-mute">Checking your connection…</p>
          ) : !data?.configured ? (
            <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-300">
              Instagram connection isn&apos;t set up yet. You can still add your account by hand
              below.
            </p>
          ) : data.connected ? (
            <>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface-1 p-3">
                {data.avatarUrl ? (
                  <img
                    src={data.avatarUrl}
                    alt={`@${data.username ?? "instagram"} profile picture`}
                    className="size-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">@{data.username}</p>
                  <p className="truncate text-xs text-ink-mute">
                    {data.followers !== null ? `${nf.format(data.followers)} followers` : "—"}
                    {data.mediaCount !== null ? ` · ${nf.format(data.mediaCount)} posts` : ""}
                    {data.accountType ? ` · ${data.accountType.toLowerCase()}` : ""}
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                  <BadgeCheck className="size-3.5" /> Verified
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-mute">
                Connected {when(data.connectedAt)} · last updated {when(data.lastSyncedAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refresh.mutate()}
                  disabled={refresh.isPending}
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  {refresh.isPending ? "Refreshing…" : "Refresh data"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                >
                  <Link2Off className="mr-1.5 size-3.5" /> Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
                <Instagram className="mr-1.5 size-3.5" />
                {connect.isPending ? "Opening Instagram…" : "Connect Instagram"}
              </Button>
              <p className="mt-2 text-xs text-ink-mute">
                Personal Instagram accounts can&apos;t share follower numbers — add those by hand
                below and our team will verify them.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
