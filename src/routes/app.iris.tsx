import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send } from "lucide-react";
import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/app/iris")({
  head: () => ({
    meta: [
      { title: "Iris — Project Eros" },
      { name: "description", content: "Your AI strategist." },
    ],
  }),
  component: IrisPage,
});

function IrisPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-violet to-rose text-white">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">Iris</p>
          <h1 className="font-display text-2xl font-extrabold text-midnight">Your AI strategist</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <Sparkles className="mx-auto mb-3 size-10 text-violet/60" />
              <p className="text-sm text-midnight/60">Ask about creators, campaigns, or strategy.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.role === "user";
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${mine ? "bg-midnight text-white" : "bg-canvas text-midnight"}`}>
                  {mine ? text : <div className="prose prose-sm max-w-none"><ReactMarkdown>{text}</ReactMarkdown></div>}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const val = inputRef.current?.value.trim();
          if (val) {
            sendMessage({ text: val });
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
        className="mt-4 flex gap-2"
      >
        <input
          ref={inputRef}
          placeholder="Ask Iris anything…"
          className="flex-1 rounded-full border border-midnight/10 bg-white px-5 py-3 text-sm shadow-sm focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-3 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
        >
          <Send className="size-4" /> Send
        </button>
      </form>
    </div>
  );
}
