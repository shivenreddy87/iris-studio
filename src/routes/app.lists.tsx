import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, List } from "lucide-react";
import { toast } from "sonner";
import { listCreatorLists, createCreatorList } from "@/lib/lists.functions";

export const Route = createFileRoute("/app/lists")({
  head: () => ({
    meta: [
      { title: "Creator lists — Project Eros" },
      { name: "description", content: "Your creator rosters." },
    ],
  }),
  component: ListsPage,
});

function ListsPage() {
  const queryClient = useQueryClient();
  const fetchFn = useServerFn(listCreatorLists);
  const createFn = useServerFn(createCreatorList);
  const [name, setName] = useState("");

  const { data: lists = [] } = useQuery({
    queryKey: ["creator-lists"],
    queryFn: () => fetchFn(),
  });

  const mutation = useMutation({
    mutationFn: (n: string) => createFn({ data: { name: n } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-lists"] });
      setName("");
      toast.success("List created");
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">Lists</p>
        <h1 className="font-display text-4xl font-extrabold text-primary">Creator rosters</h1>
      </div>

      <div className="mb-8 flex gap-3 rounded-3xl border border-hairline bg-surface-2 p-4 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name…"
          className="flex-1 rounded-full border border-hairline bg-surface-2 px-4 py-2.5 text-sm"
        />
        <button
          onClick={() => name && mutation.mutate(name)}
          disabled={!name || mutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
        >
          <Plus className="size-4" /> Create
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-surface-2/50 p-16 text-center">
          <List className="mx-auto mb-4 size-10 text-primary/30" />
          <p className="text-sm text-secondary">No lists yet — create one to save creators.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <div key={l.id} className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
              <h3 className="font-display text-xl font-bold text-primary">{l.name}</h3>
              <p className="mt-2 text-xs font-mono uppercase tracking-widest text-muted">
                Created {new Date(l.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
