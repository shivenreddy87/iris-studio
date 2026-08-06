import { Panel } from "./detail-row";
import type { Contest } from "../types";

export function ContestRules({ contest }: { contest: Contest }) {
  return (
    <Panel title="Brief and rules">
      <div className="space-y-4">
        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Contest brief
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">
            {contest.contestBrief?.trim() || "No brief written yet."}
          </p>
        </section>
        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Contest rules
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">
            {contest.contestRules?.trim() || "No rules written yet."}
          </p>
        </section>
      </div>
    </Panel>
  );
}
