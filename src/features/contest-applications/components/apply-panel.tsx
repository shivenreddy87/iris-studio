import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Panel } from "@/features/contests/components/detail-row";
import type { Contest } from "@/features/contests/types";
import { applyToContest, getApplicationContext, getMyApplicationEvents } from "../application.functions";
import type { ApplicationFormValues } from "../application.schema";
import { ContestApplicationForm } from "./contest-application-form";
import { ApplicationStatusBadge } from "./application-status-badge";
import { ApplicationTimeline } from "./application-timeline";
import { WithdrawApplicationDialog } from "./withdraw-application-dialog";
import { applicationKeys, useInvalidateApplications } from "../hooks/use-applications";
import { canWithdraw } from "../types";

/** The apply surface on the influencer contest detail page. */
export function ApplyPanel({ contest }: { contest: Contest }) {
  const invalidate = useInvalidateApplications();
  const fetchContext = useServerFn(getApplicationContext);
  const fetchEvents = useServerFn(getMyApplicationEvents);
  const apply = useServerFn(applyToContest);

  const { data, isLoading } = useQuery({
    queryKey: applicationKeys.context(contest.id),
    queryFn: () => fetchContext({ data: { contestId: contest.id } }),
  });

  const application = data?.application ?? null;

  const { data: events } = useQuery({
    queryKey: applicationKeys.events(application?.id ?? "none"),
    queryFn: () => fetchEvents({ data: { applicationId: application!.id } }),
    enabled: Boolean(application),
  });

  const mutation = useMutation({
    mutationFn: (values: ApplicationFormValues) =>
      apply({
        data: {
          contestId: contest.id,
          portfolioUrl: values.portfolioUrl,
          contentIdea: values.contentIdea,
          notes: values.notes ?? "",
          agreedToRules: true,
        },
      }),
    onSuccess: (created) => {
      toast.success("Application submitted");
      invalidate(contest.id, created.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <Panel title="Apply to this contest">
        <p className="text-sm text-ink-mute">Checking your eligibility…</p>
      </Panel>
    );
  }

  if (application) {
    return (
      <Panel title="Your application">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ApplicationStatusBadge status={application.status} />
          {canWithdraw(application, contest.status) ? (
            <WithdrawApplicationDialog
              application={application}
              onWithdrawn={() => invalidate(contest.id, application.id)}
            />
          ) : null}
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Portfolio
            </dt>
            <dd className="mt-1">
              <a
                href={application.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-violet hover:underline"
              >
                {application.portfolioUrl}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Content idea
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-ink-dim">{application.contentIdea}</dd>
          </div>
          {application.notes ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink-dim">{application.notes}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-6 border-t border-hairline pt-5">
          <ApplicationTimeline events={events ?? []} />
        </div>
      </Panel>
    );
  }

  if (!data?.canApply) {
    return (
      <Panel title="Apply to this contest">
        <div className="flex items-start gap-3 text-sm text-ink-dim">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-mute" />
          <p>{data?.reasonMessage ?? "Applications are not available for this contest."}</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Apply to this contest">
      <ContestApplicationForm
        contestRules={contest.contestRules}
        submitting={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </Panel>
  );
}
