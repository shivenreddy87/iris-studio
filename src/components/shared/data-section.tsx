import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { ListSkeleton, EmptyState } from "@/components/ui/list-skeleton";

/**
 * Single wrapper for the loading / error / empty / content states so every
 * list surface behaves identically once real queries are wired in.
 */
export function DataSection({
  loading = false,
  error,
  isEmpty = false,
  empty,
  skeletonRows = 3,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  empty: ReactNode;
  skeletonRows?: number;
  children?: ReactNode;
}) {
  if (loading) return <ListSkeleton rows={skeletonRows} />;

  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title="Something went wrong"
        hint={error instanceof Error ? error.message : "Please try again in a moment."}
      />
    );
  }

  if (isEmpty) return <>{empty}</>;

  return <>{children}</>;
}
