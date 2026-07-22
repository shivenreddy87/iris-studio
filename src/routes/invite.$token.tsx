import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { lookupInvitation, acceptInvitation } from "@/lib/team.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "You've been invited — Iris AI" },
      { name: "description", content: "Accept your invitation to join a workspace on Iris AI." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const lookup = useServerFn(lookupInvitation);
  const accept = useServerFn(acceptInvitation);

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "not_found" }
    | { status: "ready"; invite: any; context_name: string | null }
    | { status: "accepted" }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    lookup({ data: { token } })
      .then((res) => {
        if (!res.found) return setState({ status: "not_found" });
        setState({ status: "ready", invite: res.invite, context_name: res.context_name });
      })
      .catch((e: Error) => setState({ status: "error", message: e.message }));
  }, [token, lookup]);

  async function handleAccept() {
    try {
      await accept({ data: { token } });
      setState({ status: "accepted" });
      toast.success("Invitation accepted");
      setTimeout(() => navigate({ to: "/app" }), 1200);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0612] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <Link to="/" className="mb-10 font-display text-2xl font-black tracking-tight">EROS</Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
          {state.status === "loading" && (
            <div className="flex items-center gap-3 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading invitation…
            </div>
          )}
          {state.status === "not_found" && (
            <div>
              <XCircle className="mb-3 h-8 w-8 text-rose-400" />
              <h1 className="mb-2 font-display text-2xl font-bold">Invitation not found</h1>
              <p className="text-sm text-white/60">This link may have been revoked or mistyped.</p>
            </div>
          )}
          {state.status === "error" && (
            <div>
              <XCircle className="mb-3 h-8 w-8 text-rose-400" />
              <h1 className="mb-2 font-display text-2xl font-bold">Something went wrong</h1>
              <p className="text-sm text-white/60">{state.message}</p>
            </div>
          )}
          {state.status === "accepted" && (
            <div>
              <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
              <h1 className="mb-2 font-display text-2xl font-bold">You're in</h1>
              <p className="text-sm text-white/60">Redirecting to your workspace…</p>
            </div>
          )}
          {state.status === "ready" && (
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-white/40">Invitation</p>
              <h1 className="mb-3 font-display text-3xl font-bold">
                Join {state.context_name ?? (state.invite.scope === "creator" ? "a creator profile" : "an organization")}
              </h1>
              <p className="mb-6 text-sm text-white/70">
                You've been invited as <span className="capitalize font-semibold text-white">{state.invite.role}</span>.
                {" "}Sent to <span className="font-mono text-xs">{state.invite.invited_email}</span>.
              </p>

              {loading ? (
                <div className="text-sm text-white/60">Checking session…</div>
              ) : user ? (
                <button
                  onClick={handleAccept}
                  className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Accept invitation
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-white/50">Sign in to accept.</p>
                  <Link
                    to="/auth/sign-in"
                    search={{ redirect: `/invite/${token}` } as any}
                    className="block w-full rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Sign in to continue
                  </Link>
                  <Link
                    to="/auth/sign-up"
                    className="block w-full rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Create an account
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
