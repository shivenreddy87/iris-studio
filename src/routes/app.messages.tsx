import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Send } from "lucide-react";
import { listConversations, getMessages, sendMessage } from "@/lib/messages.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Project Eros" },
      { name: "description", content: "Real-time collaboration with creators." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fetchConvos = useServerFn(listConversations);
  const fetchMsgs = useServerFn(getMessages);
  const sendFn = useServerFn(sendMessage);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConvos(),
  });

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => (activeId ? fetchMsgs({ data: { conversation_id: activeId } }) : Promise.resolve([])),
    enabled: !!activeId,
  });

  // Realtime
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`msgs-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", activeId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      sendFn({ data: { conversation_id: activeId!, body } }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-hairline bg-surface-2">
        <div className="border-b border-hairline p-4">
          <h1 className="font-display text-2xl font-extrabold text-ink">Messages</h1>
        </div>
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-mute">
            <MessageSquare className="mx-auto mb-2 size-8 text-ink/30" />
            No conversations yet.
          </div>
        ) : (
          conversations.map((c) => {
            const other = user?.id === c.brand_user_id ? c.creator?.display_name : c.brand?.full_name ?? c.brand?.email;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full border-b border-hairline p-4 text-left hover:bg-surface-2 ${activeId === c.id ? "bg-surface-2" : ""}`}
              >
                <p className="font-semibold text-sm text-ink">{other ?? "Conversation"}</p>
                <p className="mt-1 truncate text-xs text-ink-mute">{c.campaign?.name ?? ""}</p>
              </button>
            );
          })
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
        {active ? (
          <>
            <div className="border-b border-hairline bg-surface-2 p-4">
              <p className="font-display text-lg font-bold text-ink">
                {user?.id === active.brand_user_id ? active.creator?.display_name : active.brand?.full_name ?? active.brand?.email}
              </p>
              <p className="text-xs text-ink-mute">{active.campaign?.name ?? ""}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-midnight text-white" : "bg-surface-2 text-ink shadow-sm"}`}>
                      {m.body}
                      <div className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-ink-mute"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) sendMutation.mutate(text.trim());
              }}
              className="flex gap-2 border-t border-hairline bg-surface-2 p-4"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-full border border-hairline bg-surface-2 px-4 py-2.5 text-sm focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
              />
              <button
                type="submit"
                disabled={!text.trim() || sendMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-ink-mute">
            Select a conversation to start.
          </div>
        )}
      </main>
    </div>
  );
}
