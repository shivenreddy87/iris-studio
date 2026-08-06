import { Panel, DetailRow, dash } from "./detail-row";
import { EligibilityCard } from "./eligibility-card";
import { RewardCard } from "./reward-card";
import { ContestDates } from "./contest-dates";
import { ContestRules } from "./contest-rules";
import { AttachmentPreview } from "@/features/campaign-requests/components/attachment-preview";
import type { Contest } from "../types";

/** Full read-only summary of a contest, reused by the wizard review step and detail pages. */
export function ContestSummary({ contest }: { contest: Contest }) {
  return (
    <div className="space-y-6">
      <Panel title="Campaign information">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <DetailRow label="Business" value={dash(contest.businessName)} />
          <DetailRow label="Business category" value={dash(contest.businessCategory)} />
          <DetailRow label="Campaign goal" value={dash(contest.campaignGoal)} />
          <DetailRow label="Campaign request" value={dash(contest.approvalReference)} />
        </dl>
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Description
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">
            {dash(contest.description)}
          </p>
        </div>
      </Panel>
      <EligibilityCard contest={contest} />
      <RewardCard contest={contest} />
      <ContestDates contest={contest} />
      <ContestRules contest={contest} />
      <Panel title="Attachment">
        <AttachmentPreview path={contest.attachmentUrl} />
      </Panel>
    </div>
  );
}
