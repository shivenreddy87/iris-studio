import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  token_hash: z.string().optional(),
  new: z.string().optional(),
  instagram_error: z.string().optional(),
});

export const Route = createFileRoute("/auth/instagram")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Finishing Instagram sign-in — Creoinfo" },
      { name: "description", content: "Completing your Instagram sign-in to Creoinfo." },
      { property: "og:title", content: "Finishing Instagram sign-in — Creoinfo" },
      { property: "og:description", content: "Completing your Instagram sign-in to Creoinfo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstagramCallbackPage,
});

function InstagramCallbackPage() {
  const search = useSearch({ from: "/auth/instagram" });
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(search.instagram_error ?? null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!search.token_hash) {
        setError((current) => current ?? "That sign-in link is no longer valid.");
        return;
      }
      const { error: otpError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: search.token_hash,
      });
      if (cancelled) return;
      if (otpError) {
        setError(otpError.message);
        return;
      }
      void navigate({ to: search.new === "1" ? "/auth/role" : "/app" });
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [search.token_hash, search.new, navigate]);

  return (
    <AuthShell
      title={error ? "We couldn't finish that." : "Signing you in…"}
      subtitle={error ?? "Hold on while we connect your Instagram account."}
    >
      {error ? (
        <button
          type="button"
          onClick={() => void navigate({ to: "/auth/sign-in" })}
          className="w-full rounded-full bg-midnight px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet"
        >
          Back to sign in
        </button>
      ) : null}
    </AuthShell>
  );
}
