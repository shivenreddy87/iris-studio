import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col bg-surface-2 px-6 py-10 lg:px-16">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tighter text-ink">
          EROS.
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle ? <p className="mb-10 text-ink-dim">{subtitle}</p> : null}
          {children}
        </div>
        {footer ? <div className="mx-auto w-full max-w-md text-sm text-ink-dim">{footer}</div> : null}
      </div>

      {/* Right: editorial panel */}
      <div className="relative hidden overflow-hidden bg-midnight lg:block">
        <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-violet/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-rose/20 blur-[120px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-16 text-white">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Iris Intelligence — Live
          </div>
          <div className="max-w-md">
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-violet">Now Orchestrating</p>
            <p className="font-display text-3xl font-bold leading-tight">
              &ldquo;Iris matched us with three creators who felt hand-picked. Our launch outperformed forecast by 34%.&rdquo;
            </p>
            <p className="mt-6 text-sm text-white/60">— Priya S., Head of Growth, Everglow</p>
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs text-white/40">
            <div>
              <div className="font-display text-2xl font-extrabold text-white">2.4k</div>
              CAMPAIGNS
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-white">18k+</div>
              CREATORS
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-white">94%</div>
              MATCH RATE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
