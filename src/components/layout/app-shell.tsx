import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Megaphone,
  Search,
  Users,
  MessageSquare,
  BarChart3,
  Sparkles,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/app", label: "Home", Icon: Home },
  { to: "/app/campaigns", label: "Campaigns", Icon: Megaphone },
  { to: "/app/discover", label: "Discover Creators", Icon: Search },
  { to: "/app/lists", label: "Creator Lists", Icon: Users },
  { to: "/app/messages", label: "Messages", Icon: MessageSquare },
  { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/app/iris", label: "Iris", Icon: Sparkles },
] as const;

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/sign-in", replace: true });
  }

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "?")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-midnight/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-midnight/5 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter text-midnight">
            EROS.
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-midnight/60 hover:bg-midnight/5 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-y border-midnight/5 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl border border-midnight/5 bg-canvas p-2.5 text-left transition-colors hover:bg-midnight/5">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-violet to-rose text-xs font-bold text-white">
              EV
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-midnight">Everglow</div>
              <div className="truncate text-xs text-midnight/50">Brand workspace</div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/app" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-midnight text-white"
                    : "text-midnight/70 hover:bg-midnight/5 hover:text-midnight"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-midnight to-violet p-5 text-white">
            <Sparkles className="mb-3 size-5" />
            <p className="mb-1 font-display text-sm font-bold">Ask Iris anything</p>
            <p className="mb-4 text-xs text-white/70">
              Your embedded strategist is one keystroke away.
            </p>
            <button className="w-full rounded-full bg-white/10 py-2 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/20">
              Open Iris
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-midnight/5 bg-canvas/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-midnight/70 hover:bg-midnight/5 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="relative min-w-0 flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-midnight/40" />
            <input
              placeholder="Search or ask Iris…"
              className="w-full rounded-full border border-midnight/10 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-midnight/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
            />
          </div>
          <button className="rounded-full p-2 text-midnight/60 hover:bg-midnight/5">
            <Bell className="size-5" />
          </button>
          <div className="size-9 rounded-full bg-gradient-to-tr from-violet to-rose" />
        </header>
        <main className="flex-1">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
