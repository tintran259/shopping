import { cn } from "@/lib/utils";

/** Pulsing placeholder block (shadcn-style). Size/shape via className. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} {...props} />;
}

export { Skeleton };
