import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-hairline bg-surface-1/80 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter text-ink">
            EROS.
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-ink-dim md:flex">
            <a href="#platform" className="transition-colors hover:text-ink">Platform</a>
            <a href="#iris" className="transition-colors hover:text-ink">Iris AI</a>
            <a href="#creators" className="transition-colors hover:text-ink">Creators</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/sign-in"
            className="px-4 py-2 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
          >
            Log in
          </Link>
          <Link
            to="/auth/role"
            className="rounded-full bg-midnight px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-midnight/10 transition-all hover:bg-violet"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-surface-2 px-6 pb-16 pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <span className="mb-6 block font-display text-2xl font-extrabold tracking-tighter text-ink">
              EROS.
            </span>
            <p className="max-w-sm text-sm text-ink-mute">
              Built for the next generation of creative commerce. Intelligence is the new leverage.
            </p>
          </div>
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-ink/30">Platform</h4>
            <ul className="space-y-4 text-sm font-medium text-ink-dim">
              <li><a href="#" className="hover:text-violet">Campaign Studio</a></li>
              <li><a href="#" className="hover:text-violet">Creator Discover</a></li>
              <li><a href="#" className="hover:text-violet">Analytics Pro</a></li>
              <li><a href="#" className="hover:text-violet">Iris Agent API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-ink/30">Connect</h4>
            <ul className="space-y-4 text-sm font-medium text-ink-dim">
              <li><a href="#" className="hover:text-violet">Twitter / X</a></li>
              <li><a href="#" className="hover:text-violet">Instagram</a></li>
              <li><a href="#" className="hover:text-violet">LinkedIn</a></li>
              <li><a href="#" className="hover:text-violet">Contact Sales</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 font-mono text-[10px] uppercase tracking-widest text-ink-mute md:flex-row">
          <p>© 2026 Project Eros. All rights orchestrated.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-ink">Privacy Policy</a>
            <a href="#" className="hover:text-ink">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
