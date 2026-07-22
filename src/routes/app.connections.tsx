import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, Trash2, ExternalLink, Instagram, Youtube, Twitter, Facebook } from "lucide-react";
import {
  PLATFORMS,
  type Platform,
  listConnectedAccounts,
  upsertConnectedAccount,
  disconnectAccount,
} from "@/lib/connected-accounts.functions";

export const Route = createFileRoute("/app/connections")({
  head: () => ({
    meta: [
      { title: "Connected accounts — Iris AI" },
      { name: "description", content: "Link your social platforms so Iris AI can enrich your portfolio and match you to campaigns." },
    ],
  }),
  component: ConnectionsPage,
});

const PLATFORM_META: Record<Platform, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  instagram: { label: "Instagram", color: "from-fuchsia-500 to-orange-400", Icon: Instagram },
  tiktok: { label: "TikTok", color: "from-cyan-400 to-pink-500", Icon: Link2 },
  youtube: { label: "YouTube", color: "from-red-500 to-red-700", Icon: Youtube },
  twitter: { label: "X (Twitter)", color: "from-neutral-700 to-neutral-900", Icon: Twitter },
  facebook: { label: "Facebook", color: "from-blue-600 to-blue-800", Icon: Facebook },
  snapchat: { label: "Snapchat", color: "from-yellow-300 to-yellow-500", Icon: Link2 },
};

function ConnectionsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listConnectedAccounts);
  const { data = [] } = useQuery({
    queryKey: ["connected-accounts"],
    queryFn: () => fetchList({ data: {} }),
  });

  const connected = new Map<string, any>(data.map((a: any) => [a.platform, a]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Connected accounts</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">Your social presence</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Link the platforms you create on. Iris AI uses this data to power your portfolio, media kit, and campaign matching.
        </p>
        <p className="mt-3 rounded-2xl border border-hairline bg-surface-2/60 p-3 text-xs text-ink-mute">
          <strong className="text-ink-dim">Currently manual.</strong> One-click OAuth for each platform is being wired via your developer apps (Meta, TikTok, Google). For now, add your handles and public stats — Iris will use them across the app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <PlatformCard key={p} platform={p} account={connected.get(p)} onChange={() => qc.invalidateQueries({ queryKey: ["connected-accounts"] })} />
        ))}
      </div>
    </div>
  );
}

function PlatformCard({
  platform,
  account,
  onChange,
}: {
  platform: Platform;
  account: any;
  onChange: () => void;
}) {
  const meta = PLATFORM_META[platform];
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(account?.handle ?? "");
  const [followers, setFollowers] = useState<string>(account?.followers?.toString() ?? "");
  const [profileUrl, setProfileUrl] = useState<string>(account?.profile_url ?? "");
  const upsert = useServerFn(upsertConnectedAccount);
  const disconnect = useServerFn(disconnectAccount);

  const save = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          platform,
          handle: handle.trim(),
          followers: followers ? parseInt(followers, 10) : undefined,
          profile_url: profileUrl.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(`${meta.label} connected`);
      setOpen(false);
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => disconnect({ data: { platform } }),
    onSuccess: () => {
      toast.success(`${meta.label} disconnected`);
      onChange();
    },
  });

  const { Icon } = meta;

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${meta.color} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-ink">{meta.label}</p>
          {account ? (
            <p className="truncate text-xs text-ink-mute">
              @{account.handle}
              {account.followers ? ` · ${account.followers.toLocaleString()} followers` : ""}
            </p>
          ) : (
            <p className="text-xs text-ink-mute">Not connected</p>
          )}
        </div>
        {account?.profile_url && (
          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-ink-mute hover:bg-surface-3 hover:text-ink">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {open ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Handle (without @)"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-violet focus:outline-none"
          />
          <input
            type="number"
            placeholder="Followers"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-violet focus:outline-none"
          />
          <input
            type="url"
            placeholder="Profile URL (optional)"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-violet focus:outline-none"
          />
          <div className="flex gap-2 pt-1">
            <button onClick={() => save.mutate()} disabled={!handle || save.isPending} className="flex-1 rounded-full bg-violet px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setOpen(false)} className="rounded-full border border-hairline px-3 py-2 text-xs font-semibold text-ink-dim hover:bg-surface-3">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setOpen(true)} className="flex-1 rounded-full border border-hairline bg-surface-1 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-3">
            {account ? "Edit" : "Connect"}
          </button>
          {account && (
            <button onClick={() => remove.mutate()} className="rounded-full border border-hairline p-2 text-ink-mute hover:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
