import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { listMyApplications } from "@/features/contest-applications/application.functions";
import {
  applicationKeys,
  useInvalidateApplications,
} from "@/features/contest-applications/hooks/use-applications";
import { ApplicationCard } from "@/features/contest-applications/components/application-card";
import { WithdrawApplicationDialog } from "@/features/contest-applications/components/withdraw-application-dialog";
import { canWithdraw } from "@/features/contest-applications/types";

export const Route = createFileRoute("/app/entries/")({
  head: () => ({
    meta: [
      { title: "My Applications — Creoinfo" },
      {
        name: "description",
        content: "Track every contest you have applied to and where each application stands.",
      },
      { property: "og:title", content: "My Applications — Creoinfo" },
      {
        property: "og:description",
        content: "Track every contest you have applied to and where each application stands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <MyApplicationsPage />
    </ProfileGate>
  ),
});

function MyApplicationsPage() {
  const fetchItems = useServerFn(listMyApplications);
  const invalidate = useInvalidateApplications();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: applicationKeys.mine,
    queryFn: () => fetchItems(),
  });

  const active = data.filter((item) => item.status !== "withdrawn");
  const withdrawn = data.filter((item) => item.status === "withdrawn");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Influencer"
        title="My Applications"
        description="Every contest application you have submitted, with its current status and history."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<ClipboardList className="size-8" />}
            title="No applications yet"
            hint="Apply to an available contest and your application will appear here."
          />
        }
      >
        <div className="space-y-10">
          {active.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                Active
              </h2>
              {active.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  action={
                    canWithdraw(application, application.contestStatus) ? (
                      <WithdrawApplicationDialog
                        application={application}
                        onWithdrawn={() => invalidate(application.contestId, application.id)}
                      />
                    ) : null
                  }
                />
              ))}
            </section>
          ) : null}

          {withdrawn.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                Withdrawn
              </h2>
              {withdrawn.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </section>
          ) : null}
        </div>
      </DataSection>
    </div>
  );
}
