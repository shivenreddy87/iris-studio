import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/app/iris")({
  head: () => ({
    meta: [
      { title: "Iris AI — Project Eros" },
      { name: "description", content: "Your embedded AI strategist." },
    ],
  }),
  component: IrisPage,
});

const SUGGESTIONS = [
  "Find wellness creators under 200k followers",
  "Draft a Diwali campaign brief, ₹8L budget",
  "Compare Elena Rossi vs Aria Vance for a skincare launch",
  "How should I negotiate a 30% counter-offer?",
];

const STORAGE_KEY = "iris-chat-messages-v1";

function loadPersisted(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function IrisPage() {
  const [initialMessages] = useState<UIMessage[]>(() => loadPersisted());
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        /* quota exceeded — silently skip */
      }
    }
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  function submit(text?: string) {
    const val = (text ?? input).trim();
    if (!val || isLoading) return;
    void sendMessage({ text: val });
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <div className="hero-dark relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden font-geist">
      {/* Ambient blur shape */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 z-0 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35), rgba(168,85,247,0.25) 40%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="liquid-glass grid size-9 place-items-center rounded-xl">
              <Sparkles className="size-4 text-foreground" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Assistant
              </p>
              <h1
                className="font-hero text-2xl font-medium leading-none text-foreground"
                style={{ letterSpacing: "-0.024em" }}
              >
                Iris{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
                  }}
                >
                  AI
                </span>
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            {empty ? (
              <EmptyState onPick={submit} />
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {isLoading && messages.at(-1)?.role === "user" ? (
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <span className="size-1.5 animate-pulse rounded-full bg-foreground/60" />
                    Iris is thinking…
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 pb-8 pt-2 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="liquid-glass flex items-end gap-2 rounded-3xl p-2"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder="Ask Iris anything…"
                className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="grid size-11 place-items-center rounded-2xl bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30"
                aria-label="Send"
              >
                <ArrowUp className="size-5" />
              </button>
            </form>
            <p className="mt-3 text-center text-[11px] text-foreground/40">
              Iris can search creators, draft briefs, and reason about campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <h2
        className="font-hero text-5xl font-normal text-foreground"
        style={{ letterSpacing: "-0.024em", lineHeight: 1.05 }}
      >
        How can I help you{" "}
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
          }}
        >
          today
        </span>
        ?
      </h2>
      <p className="mt-3 text-sm text-foreground/60">
        Discover creators, draft campaigns, or work through a negotiation.
      </p>
      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="liquid-glass group rounded-2xl px-4 py-3 text-left text-sm text-foreground/85 transition-colors hover:text-foreground"
          >
            <Search className="mb-2 size-4 text-foreground/50 transition-colors group-hover:text-foreground/80" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const mine = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const toolParts = message.parts.filter(
    (p) => typeof p.type === "string" && p.type.startsWith("tool-"),
  );

  if (mine) {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-3xl bg-foreground px-5 py-3 text-sm text-background">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {toolParts.map((tp, i) => (
        <ToolCall key={i} part={tp} />
      ))}
      {text ? (
        <div className="prose prose-invert prose-sm max-w-none text-foreground/90 [&_a]:text-[#a855f7] [&_code]:text-foreground [&_strong]:text-foreground">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}

function ToolCall({ part }: { part: UIMessage["parts"][number] }) {
  // AI SDK v5 tool part shape: { type: `tool-${name}`, state, input, output }
  const p = part as unknown as {
    type: string;
    state?: string;
    input?: unknown;
    output?: unknown;
  };
  const name = p.type.replace(/^tool-/, "");
  const done = p.state === "output-available" || p.state === "result";

  return (
    <details className="liquid-glass rounded-2xl px-4 py-3 text-xs text-foreground/70">
      <summary className="flex cursor-pointer items-center gap-2 text-foreground/80">
        <Search className="size-3.5 text-foreground/60" />
        <span className="font-mono uppercase tracking-wider text-[10px]">
          {done ? "Used tool" : "Calling tool"}
        </span>
        <span className="font-semibold text-foreground">{name}</span>
      </summary>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-foreground/60">
        {JSON.stringify({ input: p.input, output: p.output }, null, 2)}
      </pre>
    </details>
  );
}
