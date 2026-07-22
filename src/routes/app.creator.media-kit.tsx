import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyCreatorProfile, upsertCreatorProfile } from "@/lib/creators.functions";

export const Route = createFileRoute("/app/creator/media-kit")({
  head: () => ({
    meta: [
      { title: "Media kit — Project Eros" },
      { name: "description", content: "Manage your creator profile." },
    ],
  }),
  component: MediaKitPage,
});

function MediaKitPage() {
  const queryClient = useQueryClient();
  const fetchFn = useServerFn(getMyCreatorProfile);
  const upsertFn = useServerFn(upsertCreatorProfile);
  const { data: profile } = useQuery({ queryKey: ["my-creator"], queryFn: () => fetchFn() });

  const [form, setForm] = useState({
    display_name: "",
    handle: "",
    niche: "wellness",
    bio: "",
    location: "",
    followers: 0,
    engagement_rate: 0,
    avg_rate: 0,
    accent: "violet" as "violet" | "rose",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        handle: profile.handle ?? "",
        niche: profile.niche ?? "wellness",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        followers: profile.followers ?? 0,
        engagement_rate: profile.engagement_rate ?? 0,
        avg_rate: profile.avg_rate ?? 0,
        accent: profile.accent ?? "violet",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => upsertFn({ data: form }),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["my-creator"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Creator</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">Media kit</h1>
      </div>

      <div className="space-y-4 rounded-3xl border border-hairline bg-surface-2 p-8 shadow-sm">
        <Field label="Display name" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
        <Field label="Handle (@name)" value={form.handle} onChange={(v) => setForm({ ...form, handle: v })} />
        <Field label="Niche" value={form.niche} onChange={(v) => setForm({ ...form, niche: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <div>
          <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-ink-mute">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Followers" value={form.followers} onChange={(v) => setForm({ ...form, followers: v })} />
          <NumField label="Engagement %" value={form.engagement_rate} onChange={(v) => setForm({ ...form, engagement_rate: v })} />
          <NumField label="Avg rate (₹)" value={form.avg_rate} onChange={(v) => setForm({ ...form, avg_rate: v })} />
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full rounded-full bg-midnight py-3 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
        >
          {mutation.isPending ? "Saving…" : "Save media kit"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-ink-mute">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
      />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-ink-mute">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-2xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
      />
    </div>
  );
}
