import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { messagesApi } from "@/lib/api/adapters";
import { creators as allCreators } from "@/lib/api/mock-data";

const convosQuery = queryOptions({
  queryKey: ["conversations"],
  queryFn: () => messagesApi.conversations(),
});

export const Route = createFileRoute("/app/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Project Eros" },
      { name: "description", content: "Every deal conversation, with Iris in the loop." },
      { property: "og:title", content: "Messages — Project Eros" },
      { property: "og:description", content: "Deal conversations with Iris." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(convosQuery),
  component: MessagesPage,
});

function MessagesPage() {
  const { data } = useSuspenseQuery(convosQuery);
  const [activeId, setActiveId] = useState(data[0]?.id ?? "");
  const active = data.find((c) => c.id === activeId) ?? data[0];
  const creator = allCreators.find((c) => c.id === active?.creatorId);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl gap-4 px-4 py-6 lg:px-8">
      <aside className="hidden w-80 shrink-0 flex-col overflow-hidden rounded-3xl border border-midnight/5 bg-white md:flex">
        <div className="border-b border-midnight/5 p-4">
          <h1 className="font-display text-xl font-extrabold text-midnight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {data.map((c) => {
            const cr = allCreators.find((x) => x.id === c.creatorId);
            const isActive = c.id === active?.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                  isActive ? "bg-midnight/5" : "hover:bg-canvas"
                }`}
              >
                <div className="size-10 rounded-full bg-gradient-to-tr from-violet to-rose" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-semibold text-midnight">{cr?.name}</div>
                    <div className="text-[10px] text-midnight/40">{c.lastMessageAt}</div>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-midnight/50">
                    {c.messages[c.messages.length - 1]?.text}
                  </div>
                </div>
                {c.unread ? (
                  <span className="grid size-5 place-items-center rounded-full bg-violet text-[10px] font-bold text-white">
                    {c.unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-midnight/5 bg-white">
        <header className="flex items-center gap-3 border-b border-midnight/5 p-4">
          <div className="size-10 rounded-full bg-gradient-to-tr from-violet to-rose" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-midnight">{creator?.name}</div>
            <div className="text-xs text-midnight/50">{creator?.handle} · Diwali Hydration Launch</div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-violet/5 px-3 py-1.5 text-xs font-semibold text-violet hover:bg-violet/10">
            <Sparkles className="size-3.5" /> Iris co-pilot
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {active?.messages.map((m) =>
            m.from === "iris" ? (
              <div key={m.id} className="mx-auto max-w-md rounded-2xl border border-violet/20 bg-violet/5 p-3 text-center text-xs text-violet">
                <Sparkles className="mr-1 inline size-3" />
                {m.text}
              </div>
            ) : (
              <div key={m.id} className={`flex ${m.from === "brand" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === "brand"
                      ? "bg-midnight text-white"
                      : "border border-midnight/5 bg-canvas text-midnight"
                  }`}
                >
                  {m.text}
                  <div className={`mt-1 text-[10px] ${m.from === "brand" ? "text-white/50" : "text-midnight/40"}`}>{m.at}</div>
                </div>
              </div>
            ),
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-midnight/5 p-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-midnight/10 bg-canvas px-4 py-3 text-sm placeholder:text-midnight/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
          />
          <button className="grid size-11 place-items-center rounded-full bg-midnight text-white hover:bg-violet">
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
