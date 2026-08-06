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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-mute">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink-dim">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
