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
        {footer ? (
          <div className="mx-auto w-full max-w-md text-sm text-ink-dim">{footer}</div>
        ) : null}
      </div>

      {/* Right: editorial panel */}
      <div className="relative hidden overflow-hidden bg-midnight lg:block">
        <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-violet/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-rose/20 blur-[120px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-16 text-white">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Project Eros
          </div>
          <div className="max-w-md">
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-violet">
              Campaigns, end to end
            </p>
            <p className="font-display text-3xl font-bold leading-tight">
              Businesses post campaigns. Creators apply, submit and get rewarded. Every stage is
              tracked in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs text-white/40">
            <div>
              <div className="font-display text-base font-extrabold text-white">Businesses</div>
              CAMPAIGN REQUESTS
            </div>
            <div>
              <div className="font-display text-base font-extrabold text-white">Creators</div>
              CONTESTS &amp; REWARDS
            </div>
            <div>
              <div className="font-display text-base font-extrabold text-white">Admins</div>
              REVIEW &amp; PAYOUTS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
