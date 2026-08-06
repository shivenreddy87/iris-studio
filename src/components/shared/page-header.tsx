import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-fluid-title font-display font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink-dim">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 [&>*]:min-h-10 [&>button]:flex-1 sm:[&>button]:flex-none">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
