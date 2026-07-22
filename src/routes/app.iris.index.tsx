import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { createIrisThread } from "@/lib/iris.functions";

export const Route = createFileRoute("/app/iris/")({
  component: IrisIndex,
});

function IrisIndex() {
  const qc = useQueryClient();
  const createM = useMutation({
    mutationFn: () => createIrisThread({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["iris-threads"] });
      if (t?.id) {
        window.location.href = `/app/iris/${t.id}`;
      }
    },
  });

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35), rgba(168,85,247,0.25) 40%, rgba(0,0,0,0) 70%)",
        }}
      />
      <Sparkles className="mb-4 size-8 text-foreground/70" />
      <h2
        className="font-hero text-4xl font-normal text-foreground"
        style={{ letterSpacing: "-0.024em" }}
      >
        Start a new{" "}
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
          }}
        >
          Iris
        </span>{" "}
        conversation
      </h2>
      <p className="mt-3 max-w-md text-sm text-foreground/60">
        Every thread is saved to your workspace and picks up wherever you left off.
      </p>
      <button
        onClick={() => createM.mutate()}
        disabled={createM.isPending}
        className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {createM.isPending ? "Creating…" : "New conversation"}
      </button>
    </div>
  );
}
