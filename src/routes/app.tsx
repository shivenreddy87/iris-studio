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
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
