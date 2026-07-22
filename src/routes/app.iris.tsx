import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Sparkles, Send, User } from "lucide-react";

export const Route = createFileRoute("/app/iris")({
  head: () => ({
    meta: [
      { title: "Iris — Project Eros" },
      { name: "description", content: "Your embedded AI marketing strategist." },
      { property: "og:title", content: "Iris — Project Eros" },
      { property: "og:description", content: "Chat with Iris." },
    ],
  }),
  component: IrisPage,
});

type Msg = { id: string; from: "user" | "iris"; text: string };

const seed: Msg[] = [
  { id: "1", from: "iris", text: "Hi. I'm Iris. What are we planning today?" },
];

const suggestions = [
  "Plan a Diwali campaign for our hydration line, ₹8L budget",
  "Find 10 wellness micro-creators in London",
  "Compare Aria and Elena for our SS27 launch",
  "Summarize last quarter's performance",
];

function IrisPage() {
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: `u_${Date.now()}`, from: "user", text };
    const irisMsg: Msg = {
      id: `i_${Date.now()}`,
      from: "iris",
      text: "Give me a moment — I'm sketching a plan. Iris will stream a real response once the FastAPI /iris/runs endpoint is wired up.",
    };
    setMessages((m) => [...m, userMsg, irisMsg]);
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet to-rose text-white">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-midnight">Iris</h1>
          <p className="text-sm text-midnight/50">Your strategist. Always on.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-3xl border border-midnight/5 bg-white p-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`mb-5 flex gap-3 ${m.from === "user" ? "justify-end" : ""}`}
            >
              {m.from === "iris" ? (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-rose text-white">
                  <Sparkles className="size-4" />
                </div>
              ) : null}
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.from === "user"
                    ? "bg-midnight text-white"
                    : "border border-midnight/5 bg-canvas text-midnight"
                }`}
              >
                {m.text}
              </div>
              {m.from === "user" ? (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-midnight/10 text-midnight">
                  <User className="size-4" />
                </div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {messages.length <= 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-midnight/10 bg-white px-3 py-1.5 text-xs font-medium text-midnight/70 hover:border-violet/30 hover:text-violet"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="mt-4 flex items-center gap-2 rounded-full border border-midnight/10 bg-white p-2 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Iris anything…"
          className="flex-1 bg-transparent px-4 py-2 text-sm placeholder:text-midnight/40 focus:outline-none"
        />
        <button
          type="submit"
          className="grid size-10 place-items-center rounded-full bg-midnight text-white hover:bg-violet"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
