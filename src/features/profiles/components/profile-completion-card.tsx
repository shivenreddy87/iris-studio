import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { ProfileCompletion } from "../types";

export function ProfileCompletionCard({
  completion,
  showAction = true,
}: {
  completion: ProfileCompletion;
  showAction?: boolean;
}) {
  const done = completion.percent >= 100;

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-mute">
            Profile completion
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{completion.percent}%</p>
        </div>
        {done ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-xs text-ink-dim">
            <CheckCircle2 className="size-4 text-violet" /> Profile complete
          </span>
        ) : showAction ? (
          <Button asChild size="sm">
            <Link to="/app/profile">Complete profile</Link>
          </Button>
        ) : null}
      </div>

      <Progress value={completion.percent} />

      {!done && completion.missing.length > 0 ? (
        <p className="mt-4 text-sm text-ink-dim">
          Still missing: <span className="text-ink">{completion.missing.join(", ")}</span>
        </p>
      ) : null}
    </div>
  );
}
