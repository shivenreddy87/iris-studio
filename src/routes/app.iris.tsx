import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MessagesSquare, Trash2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import {
  listIrisThreads,
  createIrisThread,
  deleteIrisThread,
} from "@/lib/iris.functions";

export const Route = createFileRoute("/app/iris")({
  head: () => ({
    meta: [
      { title: "Iris AI — Project Eros" },
      { name: "description", content: "Your embedded AI strategist." },
    ],
  }),
  component: IrisLayout,
});

function IrisLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const threadsQ = useQuery({
    queryKey: ["iris-threads"],
    queryFn: () => listIrisThreads(),
  });

  const createM = useMutation({
    mutationFn: () => createIrisThread({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["iris-threads"] });
      if (t?.id) navigate({ to: "/app/iris/$threadId", params: { threadId: t.id } });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteIrisThread({ data: { id } }),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ["iris-threads"] });
      if (id === activeId) navigate({ to: "/app/iris" });
    },
  });

  // Auto-select newest thread when landing on /app/iris with no active id.
  useEffect(() => {
    if (activeId || threadsQ.isLoading) return;
    const first = threadsQ.data?.[0];
    if (first) {
      navigate({ to: "/app/iris/$threadId", params: { threadId: first.id }, replace: true });
    }
  }, [activeId, threadsQ.data, threadsQ.isLoading, navigate]);

  return (
    <div className="hero-dark flex h-[calc(100vh-4rem)] overflow-hidden font-geist">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/8 md:flex">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-foreground/70" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Threads
            </span>
          </div>
          <button
            onClick={() => createM.mutate()}
            disabled={createM.isPending}
            className="grid size-7 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
            aria-label="New conversation"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {threadsQ.isLoading ? (
            <div className="space-y-1 px-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : threadsQ.data?.length ? (
            <ul className="space-y-0.5">
              {threadsQ.data.map((t) => {
                const active = t.id === activeId;
                return (
                  <li key={t.id} className="group relative">
                    <Link
                      to="/app/iris/$threadId"
                      params={{ threadId: t.id }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-white/8 text-foreground"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <MessagesSquare className="size-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{t.title}</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Delete this conversation?")) deleteM.mutate(t.id);
                      }}
                      className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-foreground/50 hover:bg-white/10 hover:text-foreground group-hover:block"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-6 text-center text-xs text-foreground/50">
              <p>No conversations yet.</p>
              <button
                onClick={() => createM.mutate()}
                className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-foreground/80 hover:bg-white/5"
              >
                Start one
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Chat surface */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
