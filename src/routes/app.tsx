import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth/sign-in" });
    }

    // First login: businesses and influencers set up their profile once.
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", data.user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", data.user.id).limit(1).maybeSingle(),
    ]);

    if (!profile?.onboarding_completed_at) {
      if (roleRow?.role === "brand") throw redirect({ to: "/onboarding/business" });
      if (roleRow?.role === "creator") throw redirect({ to: "/onboarding/influencer" });
    }
  },

  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
