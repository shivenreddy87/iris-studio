import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Realtime presence via Supabase channel. All connected members of `channelName`
 * see who else is online. Also emits a heartbeat updating profiles.last_seen_at.
 */
export function usePresence(channelName: string) {
  const { user } = useAuth();
  const [online, setOnline] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      });

    // Heartbeat last_seen_at every 60s
    const beat = async () => {
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id);
    };
    beat();
    const interval = setInterval(beat, 60_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [channelName, user]);

  return { online, count: online.length };
}
