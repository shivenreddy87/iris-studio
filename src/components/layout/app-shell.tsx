import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Bell, Menu, X, LogOut, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { listNotifications, markAllNotificationsRead } from "@/lib/notifications.functions";
import { isNavItemActive, navigationFor } from "@/lib/navigation";
import { roleLabel, toPlatformRole } from "@/lib/roles";
import { isGatedPath, useProfileGate } from "@/features/profiles/components/profile-gate";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const fetchNotifs = useServerFn(listNotifications);
  const markAllRead = useServerFn(markAllNotificationsRead);

  const platformRole = toPlatformRole(role);
  const nav = navigationFor(platformRole);
  const { unlocked } = useProfileGate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-midnight/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-[hsl(260_60%_6%)] text-white/90 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter text-white">
            EROS.
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-white/60 hover:bg-white/5 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-y border-white/5 p-4">
          <div className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5 text-left">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-violet to-rose text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user?.user_metadata?.full_name ?? user?.email ?? "Signed in"}
              </div>
              <div className="truncate text-xs text-white/50">{`${roleLabel(role)} workspace`}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => {
            const active = isNavItemActive(item, pathname);
            const locked = !unlocked && isGatedPath(String(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-midnight"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                } ${locked && !active ? "opacity-40" : ""}`}
              >
                <item.Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {locked ? <Lock className="size-3.5" /> : null}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-[hsl(260_87%_3%/0.8)] px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="relative min-w-0 flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              placeholder="Search contests, requests and people…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/20"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-full p-2 text-white/60 hover:bg-white/5"
            >
              <Bell className="size-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-rose text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notifOpen ? (
              <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-hairline bg-[hsl(260_50%_9%)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 p-3">
                  <span className="font-semibold text-sm text-white">Notifications</span>
                  {unreadCount > 0 ? (
                    <button
                      onClick={async () => {
                        await markAllRead();
                        queryClient.invalidateQueries({ queryKey: ["notifications"] });
                      }}
                      className="text-xs text-violet hover:underline"
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-white/50">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link ?? "/app"}
                        onClick={() => setNotifOpen(false)}
                        className={`block border-b border-white/5 p-3 text-sm hover:bg-white/5 ${
                          n.read_at ? "opacity-60" : ""
                        }`}
                      >
                        <div className="font-semibold text-white">{n.title}</div>
                        {n.body ? (
                          <div className="text-xs text-white/60 line-clamp-2">{n.body}</div>
                        ) : null}
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-tr from-violet to-rose text-xs font-bold text-white">
            {initials}
          </div>
        </header>
        <main className="flex-1">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
