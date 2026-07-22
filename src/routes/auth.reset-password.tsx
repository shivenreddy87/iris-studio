import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Project Eros" },
      { name: "description", content: "Set a new password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-surface-2 p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setLoading(false);
          if (error) toast.error(error.message);
          else {
            toast.success("Password updated");
            window.location.href = "/app";
          }
        }}
        className="w-full max-w-md space-y-4 rounded-3xl border border-hairline bg-surface-2 p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-extrabold text-primary">Set new password</h1>
        <input
          type="password"
          required
          minLength={8}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password"
          className="w-full rounded-2xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-midnight py-3 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
