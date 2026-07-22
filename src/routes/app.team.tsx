import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Trash2, UserPlus, Circle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";
import {
  listOrgMembers,
  removeOrgMember,
  listCreatorCollaborators,
  removeCreatorCollaborator,
  createInvitation,
  listInvitations,
  revokeInvitation,
} from "@/lib/team.functions";

export const Route = createFileRoute("/app/team")({
  head: () => ({
    meta: [
      { title: "Team — Iris AI" },
      { name: "description", content: "Invite teammates and collaborators to your Iris AI workspace." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { role } = useAuth();
  const scope: "organization" | "creator" = role === "creator" ? "creator" : "organization";
  const { count } = usePresence("team-presence");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Team</p>
          <h1 className="font-display text-4xl font-extrabold text-ink">
            {scope === "creator" ? "Creator collaborators" : "Your organization"}
          </h1>
          <p className="mt-2 text-sm text-ink-dim">
            {scope === "creator"
              ? "Invite managers or agents to help manage your profile, deals, and analytics."
              : "Invite teammates to collaborate on campaigns, creators, and analytics."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 text-xs text-ink-dim">
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          {count} online
        </div>
      </div>

      <InviteForm scope={scope} />
      <MembersList scope={scope} />
      <PendingInvites scope={scope} />
    </div>
  );
}

function InviteForm({ scope }: { scope: "organization" | "creator" }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(scope === "creator" ? "manager" : "member");
  const qc = useQueryClient();
  const invite = useServerFn(createInvitation);

  const mutation = useMutation({
    mutationFn: () => invite({ data: { email, scope, role } }),
    onSuccess: (res) => {
      const link = `${window.location.origin}/invite/${res.token}`;
      navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Invite created — link copied to clipboard");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invitations", scope] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roles = scope === "creator" ? ["manager", "agent", "viewer"] : ["admin", "member"];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) return;
        mutation.mutate();
      }}
      className="mb-8 rounded-3xl border border-hairline bg-surface-2 p-6"
    >
      <h2 className="mb-4 font-display text-lg font-bold text-ink">Invite someone</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-full border border-hairline bg-surface-1 px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-violet focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-full border border-hairline bg-surface-1 px-4 py-2.5 text-sm text-ink capitalize focus:border-violet focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> Send invite
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-mute">
        We generate a one-time link (valid 7 days). Copy it and share with the invitee.
      </p>
    </form>
  );
}

function MembersList({ scope }: { scope: "organization" | "creator" }) {
  const qc = useQueryClient();
  const fetchOrg = useServerFn(listOrgMembers);
  const fetchCreator = useServerFn(listCreatorCollaborators);
  const removeOrg = useServerFn(removeOrgMember);
  const removeCreator = useServerFn(removeCreatorCollaborator);

  const { data = [] } = useQuery({
    queryKey: ["members", scope],
    queryFn: () => (scope === "organization" ? fetchOrg() : fetchCreator()),
  });

  const rm = useMutation({
    mutationFn: (id: string) =>
      scope === "organization" ? removeOrg({ data: { memberId: id } }) : removeCreator({ data: { collaboratorId: id } }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["members", scope] });
    },
  });

  return (
    <div className="mb-8 rounded-3xl border border-hairline bg-surface-2 p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">Active members</h2>
      {data.length === 0 ? (
        <p className="text-sm text-ink-mute">No one else yet — invite your first teammate above.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((m: any) => (
            <li key={m.id} className="flex items-center justify-between rounded-2xl border border-hairline bg-surface-1 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{m.profiles?.full_name ?? m.profiles?.email ?? "Unknown"}</p>
                <p className="truncate text-xs text-ink-mute">{m.profiles?.email} · <span className="capitalize">{m.role}</span></p>
              </div>
              <button onClick={() => rm.mutate(m.id)} className="rounded-full p-2 text-ink-mute hover:bg-surface-3 hover:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PendingInvites({ scope }: { scope: "organization" | "creator" }) {
  const qc = useQueryClient();
  const list = useServerFn(listInvitations);
  const revoke = useServerFn(revokeInvitation);
  const { data = [] } = useQuery({
    queryKey: ["invitations", scope],
    queryFn: () => list({ data: { scope } }),
  });

  const pending = data.filter((i: any) => i.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">Pending invites</h2>
      <ul className="space-y-2">
        {pending.map((i: any) => {
          const link = typeof window !== "undefined" ? `${window.location.origin}/invite/${i.token}` : "";
          return (
            <li key={i.id} className="flex items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface-1 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{i.invited_email}</p>
                <p className="truncate text-xs text-ink-mute">
                  <span className="capitalize">{i.role}</span> · expires {new Date(i.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied");
                  }}
                  className="rounded-full p-2 text-ink-mute hover:bg-surface-3 hover:text-ink"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    revoke({ data: { inviteId: i.id } }).then(() => {
                      toast.success("Revoked");
                      qc.invalidateQueries({ queryKey: ["invitations", scope] });
                    });
                  }}
                  className="rounded-full p-2 text-ink-mute hover:bg-surface-3 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
