import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching `ProductLineRow`'s layout (cart + wishlist). */
export function ProductLineRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-20 rounded-xl sm:size-24" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
