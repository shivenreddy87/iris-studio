import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveContest, unsaveContest } from "../saved.functions";

/** Toggles a contest in the influencer's saved list. */
export function SavedContestButton({
  contestId,
  saved,
  size = "sm",
  label,
}: {
  contestId: string;
  saved: boolean;
  size?: "sm" | "default";
  label?: string;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveContest);
  const unsave = useServerFn(unsaveContest);

  const mutation = useMutation({
    mutationFn: async () =>
      saved ? unsave({ data: { contestId } }) : save({ data: { contestId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", "discovery"] });
      queryClient.invalidateQueries({ queryKey: ["contests", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["contests", "detail", contestId] });
      toast.success(saved ? "Removed from saved contests." : "Saved to your contests.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Button
      type="button"
      size={size}
      variant={saved ? "secondary" : "outline"}
      disabled={mutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        mutation.mutate();
      }}
      aria-label={saved ? "Remove from saved contests" : "Save contest"}
    >
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {label ?? (saved ? "Saved" : "Save")}
    </Button>
  );
}
