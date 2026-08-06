import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  addModerationRecord,
  getPlatformSettings,
  getPlatformSettingsHistory,
  listAdminBusinesses,
  listAdminInfluencers,
  listContestTemplates,
  listModerationRecords,
  listPlatformCategories,
  listPlatformChannels,
  listPlatformSuspensions,
  reactivatePlatformUser,
  removeContestTemplate,
  removePlatformCategory,
  removePlatformChannel,
  saveContestTemplate,
  savePlatformCategory,
  savePlatformChannel,
  suspendPlatformUser,
  updatePlatformSettings,
} from "../admin.functions";
import type { ModerationTargetType } from "../types";

function useInvalidate(keys: string[][]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

export function useAdminBusinesses(search: string) {
  const fetcher = useServerFn(listAdminBusinesses);
  return useQuery({
    queryKey: ["admin", "businesses", search],
    queryFn: () => fetcher({ data: { search } }),
  });
}

export function useAdminInfluencers(search: string) {
  const fetcher = useServerFn(listAdminInfluencers);
  return useQuery({
    queryKey: ["admin", "influencers", search],
    queryFn: () => fetcher({ data: { search } }),
  });
}

export function useSuspensions() {
  const fetcher = useServerFn(listPlatformSuspensions);
  return useQuery({ queryKey: ["admin", "suspensions"], queryFn: () => fetcher() });
}

export function useModerationRecords(filter?: {
  targetType?: ModerationTargetType;
  targetId?: string;
}) {
  const fetcher = useServerFn(listModerationRecords);
  return useQuery({
    queryKey: ["admin", "moderation", filter ?? {}],
    queryFn: () => fetcher({ data: filter ?? {} }),
  });
}

export function useModerationActions() {
  const invalidate = useInvalidate([
    ["admin", "moderation"],
    ["admin", "suspensions"],
    ["admin", "businesses"],
    ["admin", "influencers"],
  ]);
  const suspendFn = useServerFn(suspendPlatformUser);
  const reactivateFn = useServerFn(reactivatePlatformUser);
  const recordFn = useServerFn(addModerationRecord);

  const suspend = useMutation({
    mutationFn: (input: { userId: string; role: "business" | "influencer"; reason: string }) =>
      suspendFn({ data: input }),
    onSuccess: () => {
      toast.success("Account suspended");
      invalidate();
    },
    onError: (error: Error) => toast.error("Could not suspend", { description: error.message }),
  });

  const reactivate = useMutation({
    mutationFn: (input: { userId: string; role: "business" | "influencer"; note?: string }) =>
      reactivateFn({ data: input }),
    onSuccess: () => {
      toast.success("Account reactivated");
      invalidate();
    },
    onError: (error: Error) => toast.error("Could not reactivate", { description: error.message }),
  });

  const record = useMutation({
    mutationFn: (input: Parameters<typeof recordFn>[0] extends { data: infer D } ? D : never) =>
      recordFn({ data: input }),
    onSuccess: () => {
      toast.success("Moderation note saved");
      invalidate();
    },
    onError: (error: Error) => toast.error("Could not save note", { description: error.message }),
  });

  return { suspend, reactivate, record };
}

export function usePlatformCategories(kind?: "business" | "creator") {
  const fetcher = useServerFn(listPlatformCategories);
  return useQuery({
    queryKey: ["admin", "categories", kind ?? "all"],
    queryFn: () => fetcher({ data: kind ? { kind } : {} }),
  });
}

export function usePlatformChannels() {
  const fetcher = useServerFn(listPlatformChannels);
  return useQuery({ queryKey: ["admin", "channels"], queryFn: () => fetcher() });
}

export function useTaxonomyActions() {
  const invalidate = useInvalidate([
    ["admin", "categories"],
    ["admin", "channels"],
  ]);
  const saveCategoryFn = useServerFn(savePlatformCategory);
  const removeCategoryFn = useServerFn(removePlatformCategory);
  const saveChannelFn = useServerFn(savePlatformChannel);
  const removeChannelFn = useServerFn(removePlatformChannel);

  const options = {
    onSuccess: () => {
      toast.success("Saved");
      invalidate();
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  };

  return {
    saveCategory: useMutation({
      mutationFn: (input: {
        id?: string;
        kind: "business" | "creator";
        name?: string;
        isActive?: boolean;
        sortOrder?: number;
      }) => saveCategoryFn({ data: input }),
      ...options,
    }),
    removeCategory: useMutation({
      mutationFn: (id: string) => removeCategoryFn({ data: { id } }),
      ...options,
    }),
    saveChannel: useMutation({
      mutationFn: (input: { id?: string; name?: string; isActive?: boolean; sortOrder?: number }) =>
        saveChannelFn({ data: input }),
      ...options,
    }),
    removeChannel: useMutation({
      mutationFn: (id: string) => removeChannelFn({ data: { id } }),
      ...options,
    }),
  };
}

export function useContestTemplates() {
  const fetcher = useServerFn(listContestTemplates);
  return useQuery({ queryKey: ["admin", "templates"], queryFn: () => fetcher() });
}

export function useTemplateActions() {
  const invalidate = useInvalidate([["admin", "templates"]]);
  const saveFn = useServerFn(saveContestTemplate);
  const removeFn = useServerFn(removeContestTemplate);

  return {
    save: useMutation({
      mutationFn: (input: Parameters<typeof saveFn>[0] extends { data: infer D } ? D : never) =>
        saveFn({ data: input }),
      onSuccess: () => {
        toast.success("Template saved");
        invalidate();
      },
      onError: (error: Error) => toast.error("Save failed", { description: error.message }),
    }),
    remove: useMutation({
      mutationFn: (id: string) => removeFn({ data: { id } }),
      onSuccess: () => {
        toast.success("Template removed");
        invalidate();
      },
      onError: (error: Error) => toast.error("Delete failed", { description: error.message }),
    }),
  };
}

export function usePlatformSettings() {
  const fetcher = useServerFn(getPlatformSettings);
  return useQuery({ queryKey: ["admin", "settings"], queryFn: () => fetcher() });
}

export function useSettingsHistory() {
  const fetcher = useServerFn(getPlatformSettingsHistory);
  return useQuery({ queryKey: ["admin", "settings", "history"], queryFn: () => fetcher() });
}

export function useUpdateSettings() {
  const invalidate = useInvalidate([["admin", "settings"]]);
  const saveFn = useServerFn(updatePlatformSettings);
  return useMutation({
    mutationFn: (input: Parameters<typeof saveFn>[0] extends { data: infer D } ? D : never) =>
      saveFn({ data: input }),
    onSuccess: (result) => {
      toast.success(`Settings saved (v${result.version})`);
      invalidate();
    },
    onError: (error: Error) => toast.error("Save failed", { description: error.message }),
  });
}
