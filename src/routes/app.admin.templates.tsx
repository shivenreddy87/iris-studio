import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateEditor } from "@/features/platform-admin/components/template-editor";
import { useContestTemplates, useTemplateActions } from "@/features/platform-admin/hooks/use-admin";

export const Route = createFileRoute("/app/admin/templates")({
  head: () => ({
    meta: [
      { title: "Contest Templates — Project Eros" },
      {
        name: "description",
        content: "Reusable contest briefs, rules, rewards and eligibility presets.",
      },
      { property: "og:title", content: "Contest Templates — Project Eros" },
      {
        property: "og:description",
        content: "Reusable contest briefs, rules, rewards and eligibility presets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContestTemplatesPage,
});

function ContestTemplatesPage() {
  const templates = useContestTemplates();
  const { save, remove } = useTemplateActions();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Administration"
        title="Contest templates"
        description="Presets that speed up contest creation without changing the contest workflow."
      />
      <TemplateEditor
        templates={templates.data}
        loading={templates.isLoading}
        error={templates.error}
        pending={save.isPending}
        onSave={(input) => save.mutate(input)}
        onRemove={(id) => remove.mutate(id)}
      />
    </div>
  );
}
