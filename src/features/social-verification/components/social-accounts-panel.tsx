import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Clock, Copy, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  deleteSocialAccount,
  getMySocialAccounts,
  requestSocialVerification,
  saveSocialAccount,
} from "../verification.functions";
import {
  PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type SocialAccount,
  type SocialPlatform,
} from "../types";

export function VerificationBadge({ status }: { status: SocialAccount["status"] }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
        <BadgeCheck className="size-3.5" /> Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
        <Clock className="size-3.5" /> Awaiting review
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
        <ShieldAlert className="size-3.5" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-ink-mute">
      Not verified
    </span>
  );
}

export function SocialAccountsPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(getMySocialAccounts);
  const save = useServerFn(saveSocialAccount);
  const remove = useServerFn(deleteSocialAccount);
  const request = useServerFn(requestSocialVerification);

  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["social-accounts"] });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({ data: { platform, handle, profileUrl: profileUrl || undefined } as never }),
    onSuccess: async () => {
      setAdding(false);
      setHandle("");
      setProfileUrl("");
      await refresh();
      toast.success("Social account saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestMutation = useMutation({
    mutationFn: (accountId: string) => request({ data: { accountId } }),
    onSuccess: async () => {
      await refresh();
      toast.success("Verification requested. Our team reviews it shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (accountId: string) => remove({ data: { accountId } }),
    onSuccess: async () => {
      await refresh();
      toast.success("Account removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-3xl border border-hairline bg-surface-2 p-4 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">Social accounts</h2>
          <p className="mt-1 text-sm text-ink-mute">
            Verified accounts prove you own the profile you enter contests with.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1.5 size-3.5" /> {adding ? "Cancel" : "Add"}
        </Button>
      </div>

      {adding ? (
        <form
          className="mt-5 grid gap-4 rounded-2xl border border-hairline bg-surface-1 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger className="tap-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sv-handle">Handle</Label>
            <Input
              id="sv-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourhandle"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sv-url">Profile URL (optional)</Label>
            <Input
              id="sv-url"
              inputMode="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
              {saveMutation.isPending ? "Saving…" : "Save account"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <ListSkeleton rows={2} />
        ) : (accounts ?? []).length === 0 ? (
          <p className="text-sm text-ink-mute">No social accounts added yet.</p>
        ) : (
          (accounts ?? []).map((account) => (
            <article
              key={account.id}
              className="rounded-2xl border border-hairline bg-surface-1 p-4"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {PLATFORM_LABELS[account.platform] ?? account.platform} · @{account.handle}
                  </p>
                  {account.profileUrl ? (
                    <p className="truncate text-xs text-ink-mute">{account.profileUrl}</p>
                  ) : null}
                </div>
                <VerificationBadge status={account.status} />
              </div>

              {account.status === "rejected" && account.rejectionReason ? (
                <p className="mt-3 rounded-xl bg-red-500/5 p-3 text-xs text-red-300">
                  {account.rejectionReason}
                </p>
              ) : null}

              {account.status !== "verified" && account.verificationCode ? (
                <div className="mt-3 rounded-xl border border-hairline bg-surface-2 p-3">
                  <p className="text-xs text-ink-mute">
                    Add this code to your public bio, then request verification. Remove it once
                    approved.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-black/40 px-2.5 py-1 font-mono text-xs text-ink">
                      {account.verificationCode}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard?.writeText(account.verificationCode ?? "");
                        toast.success("Code copied.");
                      }}
                    >
                      <Copy className="mr-1.5 size-3.5" /> Copy
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {account.status === "pending" ? null : account.status === "verified" ? null : (
                  <Button
                    size="sm"
                    onClick={() => requestMutation.mutate(account.id)}
                    disabled={requestMutation.isPending}
                  >
                    Request verification
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMutation.mutate(account.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="mr-1.5 size-3.5" /> Remove
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
