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
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const fetchNotifs = useServerFn(listNotifications);
  const markAllRead = useServerFn(markAllNotificationsRead);

  const platformRole = toPlatformRole(role);
  const nav = navigationFor(platformRole);
  const { unlocked } = useProfileGate();

  const { data: notifResult } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs({ data: { limit: 10 } }),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const notifications = notifResult?.items ?? [];
  const unreadCount = notifResult?.unreadCount ?? 0;

  // Close transient overlays whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll behind the mobile drawer, and close it with Escape.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    <div className="flex min-h-[100dvh] bg-canvas">
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-midnight/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col overflow-y-auto overscroll-contain border-r border-white/5 bg-[hsl(260_60%_6%)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white/90 transition-transform duration-200 will-change-transform lg:sticky lg:top-0 lg:h-[100dvh] lg:w-72 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5 lg:px-6">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter text-white">
            EROS.
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-lg text-white/60 hover:bg-white/5 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-y border-white/5 p-4">
          <div className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5 text-left">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-violet to-rose text-xs font-bold text-white">
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
              aria-label="Sign out"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
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
                data-nav
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors lg:py-2.5 ${
                  active
                    ? "bg-white text-midnight"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                } ${locked && !active ? "opacity-40" : ""}`}
              >
                <item.Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {locked ? <Lock className="size-3.5 shrink-0" /> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-white/5 bg-[hsl(260_87%_3%/0.85)] px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-4 sm:px-4 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          {/* Search: inline on tablet+, expandable on phones so the header never crowds. */}
          <div className="relative hidden min-w-0 max-w-lg flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder="Search contests, requests and people…"
              aria-label="Search"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/20"
            />
          </div>
          <div className="flex-1 sm:hidden" />

          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="grid size-10 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/5 sm:hidden"
          >
            <Search className="size-5" />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              aria-expanded={notifOpen}
              className="relative grid size-10 place-items-center rounded-full text-white/60 hover:bg-white/5"
            >
              <Bell className="size-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-rose text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notifOpen ? (
              <>
                <div
                  className="fixed inset-0 z-30 sm:hidden"
                  onClick={() => setNotifOpen(false)}
                  aria-hidden
                />
                <div className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-40 overflow-hidden rounded-2xl border border-hairline bg-[hsl(260_50%_9%)] shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80">
                  <div className="flex items-center justify-between border-b border-white/5 p-3">
                    <span className="text-sm font-semibold text-white">Notifications</span>
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
                  <div className="max-h-[60dvh] overflow-y-auto overscroll-contain sm:max-h-96">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-white/50">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          to={n.actionUrl ?? n.link ?? "/app"}
                          onClick={() => setNotifOpen(false)}
                          className={`block border-b border-white/5 p-3 text-sm hover:bg-white/5 ${
                            n.readAt ? "opacity-60" : ""
                          }`}
                        >
                          <div className="font-semibold text-white">{n.title}</div>
                          {n.body ? (
                            <div className="line-clamp-2 text-xs text-white/60">{n.body}</div>
                          ) : null}
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="hidden size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-violet to-rose text-xs font-bold text-white xs:grid">
            {initials}
          </div>
        </header>

        {searchOpen ? (
          <div className="sticky top-16 z-10 border-b border-white/5 bg-[hsl(260_87%_3%/0.95)] p-3 backdrop-blur-md sm:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <input
                autoFocus
                type="search"
                placeholder="Search…"
                aria-label="Search"
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-violet focus:outline-none"
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 pb-[env(safe-area-inset-bottom)]">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
