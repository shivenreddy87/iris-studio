import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAdminBusinesses } from "@/features/platform-admin/admin.functions";
import {
  createAdminContest,
  createContestFromRequest,
  listApprovedRequestsWithoutContest,
} from "@/features/contests/contest.functions";
import { contestKeys, useInvalidateContest } from "@/features/contests/hooks/use-contests";
import { dateOr, money, numOr } from "@/features/contests/components/detail-row";
import type { ContestSource } from "@/features/contests/types";

export const Route = createFileRoute("/app/admin/contests/new")({
  head: () => ({
    meta: [
      { title: "New Contest — Creoinfo" },
      { name: "description", content: "Create a contest from an approved campaign request." },
      { property: "og:title", content: "New Contest — Creoinfo" },
      {
        property: "og:description",
        content: "Create a contest from an approved campaign request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNewContestPage,
});

function AdminNewContestPage() {
  const fetchSources = useServerFn(listApprovedRequestsWithoutContest);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({ queryKey: contestKeys.sources, queryFn: () => fetchSources() });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="New Contest"
        description="Pick an approved campaign request to turn into a contest draft."
      />
      <ScratchContestForm />

      <h2 className="mb-3 mt-10 font-display text-lg font-semibold text-ink">
        From an approved request
      </h2>
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<FileCheck2 className="size-8" />}
            title="No approved requests waiting"
            hint="Approve a campaign request first — every contest starts from one."
          />
        }
      >
        <div className="grid gap-3">
          {data.map((source) => (
            <SourceRow key={source.id} source={source} />
          ))}
        </div>
      </DataSection>
    </div>
  );
}

function SourceRow({ source }: { source: ContestSource }) {
  const navigate = useNavigate();
  const invalidate = useInvalidateContest();
  const createFn = useServerFn(createContestFromRequest);

  const create = useMutation({
    mutationFn: () => createFn({ data: { campaignRequestId: source.id } }),
    onSuccess: (contest) => {
      toast.success("Contest draft created");
      invalidate(contest.id);
      void navigate({
        to: "/app/admin/contests/$contestId/edit",
        params: { contestId: contest.id },
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-hairline bg-surface-2 p-5">
      <div>
        <p className="font-display text-base font-semibold text-ink">{source.title}</p>
        <p className="text-sm text-ink-dim">
          {source.businessName ?? "Business"}
          {source.approvalReference ? ` · ${source.approvalReference}` : ""}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Budget {money(source.budget)} · Views {numOr(source.requiredViews)} · Approved{" "}
          {dateOr(source.approvedAt)}
        </p>
      </div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create contest draft
      </Button>
    </div>
  );
}

function ScratchContestForm() {
  const navigate = useNavigate();
  const fetchBusinesses = useServerFn(listAdminBusinesses);
  const createFn = useServerFn(createAdminContest);
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [targetPlatform, setTargetPlatform] = useState<"instagram" | "youtube">("instagram");
  const [targetLocation, setTargetLocation] = useState("");
  const [requiredViews, setRequiredViews] = useState("");
  const [budget, setBudget] = useState("");

  const { data: businesses = [] } = useQuery({
    queryKey: ["admin-businesses", "contest-scratch"],
    queryFn: () => fetchBusinesses({ data: {} }),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          businessId,
          title: title.trim(),
          description: description.trim() || undefined,
          campaignGoal: campaignGoal.trim() || undefined,
          targetPlatform,
          targetLocation: targetLocation.trim() || undefined,
          requiredViews: requiredViews ? Number(requiredViews) : undefined,
          budget: budget ? Number(budget) : undefined,
        },
      }),
    onSuccess: (contest) => {
      toast.success("Contest draft created");
      void navigate({
        to: "/app/admin/contests/$contestId/edit",
        params: { contestId: contest.id },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mb-8 rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">Create from scratch</p>
          <p className="text-sm text-ink-dim">
            Start a contest for a business yourself — the approved request is recorded for you.
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Create from scratch"}
        </Button>
      </div>

      {open ? (
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!businessId) {
              toast.error("Pick a business first.");
              return;
            }
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Business</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger className="tap-target">
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name ?? b.email ?? b.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-title">Contest title</Label>
            <Input id="ac-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ac-desc">Brief</Label>
            <Textarea
              id="ac-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-goal">Campaign goal</Label>
            <Input id="ac-goal" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select
              value={targetPlatform}
              onValueChange={(v) => setTargetPlatform(v as "instagram" | "youtube")}
            >
              <SelectTrigger className="tap-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-loc">Location</Label>
            <Input id="ac-loc" value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-views">Required views</Label>
            <Input
              id="ac-views"
              inputMode="numeric"
              value={requiredViews}
              onChange={(e) => setRequiredViews(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-budget">Reward pool</Label>
            <Input
              id="ac-budget"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create contest draft"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
