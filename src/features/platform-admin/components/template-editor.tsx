import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { formatCurrency } from "@/features/analytics/chart.helpers";
import type { ContestTemplate } from "../types";
import type { TemplateInput } from "../admin.server";

const EMPTY: TemplateInput = {
  name: "",
  description: "",
  contestBrief: "",
  contestRules: "",
  eligibility: {},
  rewardPool: null,
  participantLimit: null,
  winnerCount: null,
  targetPlatform: "",
  preferredCreatorCategory: "",
  isActive: true,
};

function toInput(template: ContestTemplate): TemplateInput {
  return {
    name: template.name,
    description: template.description,
    contestBrief: template.contestBrief,
    contestRules: template.contestRules,
    eligibility: template.eligibility,
    rewardPool: template.rewardPool,
    participantLimit: template.participantLimit,
    winnerCount: template.winnerCount,
    targetPlatform: template.targetPlatform,
    preferredCreatorCategory: template.preferredCreatorCategory,
    isActive: template.isActive,
  };
}

export function TemplateEditor({
  templates,
  loading,
  error,
  pending,
  onSave,
  onRemove,
}: {
  templates: ContestTemplate[] | undefined;
  loading: boolean;
  error: unknown;
  pending: boolean;
  onSave: (input: { id?: string; template: TemplateInput }) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState<{ id?: string; template: TemplateInput } | null>(null);
  const draft = editing?.template;

  function patch(next: Partial<TemplateInput>) {
    setEditing((prev) => (prev ? { ...prev, template: { ...prev.template, ...next } } : prev));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ template: { ...EMPTY } })}>
          <Plus className="size-4" /> New template
        </Button>
      </div>

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!templates?.length}
        empty={
          <EmptyState
            title="No contest templates"
            hint="Templates pre-fill briefs, rules and eligibility when creating contests."
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(templates ?? []).map((template) => (
            <article
              key={template.id}
              className="rounded-3xl border border-hairline bg-surface-2 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{template.name}</h3>
                  <p className="mt-1 text-sm text-ink-dim">{template.description}</p>
                </div>
                <Badge variant={template.isActive ? "secondary" : "outline"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                <div>
                  <dt>Reward</dt>
                  <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
                    {formatCurrency(template.rewardPool)}
                  </dd>
                </div>
                <div>
                  <dt>Participants</dt>
                  <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
                    {template.participantLimit ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Winners</dt>
                  <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
                    {template.winnerCount ?? "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing({ id: template.id, template: toInput(template) })}
                >
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onRemove(template.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </DataSection>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle>
          </DialogHeader>

          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-description">Description</Label>
                <Input
                  id="tpl-description"
                  value={draft.description ?? ""}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="tpl-reward">Reward pool</Label>
                  <Input
                    id="tpl-reward"
                    type="number"
                    value={draft.rewardPool ?? ""}
                    onChange={(event) =>
                      patch({ rewardPool: event.target.value ? Number(event.target.value) : null })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tpl-participants">Participant limit</Label>
                  <Input
                    id="tpl-participants"
                    type="number"
                    value={draft.participantLimit ?? ""}
                    onChange={(event) =>
                      patch({
                        participantLimit: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tpl-winners">Winner count</Label>
                  <Input
                    id="tpl-winners"
                    type="number"
                    value={draft.winnerCount ?? ""}
                    onChange={(event) =>
                      patch({ winnerCount: event.target.value ? Number(event.target.value) : null })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="tpl-platform">Target platform</Label>
                  <Input
                    id="tpl-platform"
                    value={draft.targetPlatform ?? ""}
                    onChange={(event) => patch({ targetPlatform: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tpl-category">Creator category</Label>
                  <Input
                    id="tpl-category"
                    value={draft.preferredCreatorCategory ?? ""}
                    onChange={(event) => patch({ preferredCreatorCategory: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="tpl-min">Min followers</Label>
                  <Input
                    id="tpl-min"
                    type="number"
                    value={draft.eligibility?.minimumFollowers ?? ""}
                    onChange={(event) =>
                      patch({
                        eligibility: {
                          ...draft.eligibility,
                          minimumFollowers: event.target.value ? Number(event.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tpl-max">Max followers</Label>
                  <Input
                    id="tpl-max"
                    type="number"
                    value={draft.eligibility?.maximumFollowers ?? ""}
                    onChange={(event) =>
                      patch({
                        eligibility: {
                          ...draft.eligibility,
                          maximumFollowers: event.target.value ? Number(event.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tpl-location">Location</Label>
                  <Input
                    id="tpl-location"
                    value={draft.eligibility?.location ?? ""}
                    onChange={(event) =>
                      patch({
                        eligibility: { ...draft.eligibility, location: event.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-brief">Contest brief</Label>
                <Textarea
                  id="tpl-brief"
                  rows={4}
                  value={draft.contestBrief ?? ""}
                  onChange={(event) => patch({ contestBrief: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-rules">Contest rules</Label>
                <Textarea
                  id="tpl-rules"
                  rows={4}
                  value={draft.contestRules ?? ""}
                  onChange={(event) => patch({ contestRules: event.target.value })}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !draft?.name.trim()}
              onClick={() => {
                if (!editing) return;
                onSave(editing);
                setEditing(null);
              }}
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
