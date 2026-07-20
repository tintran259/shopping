import { AccountSkeletonShell } from "@/features/account/components/account-skeleton-shell";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountSkeletonShell>
        <div className="space-y-6">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-6 space-y-5">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="size-16 animate-pulse rounded-full bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-36 animate-pulse rounded bg-muted" />
              </div>
            </div>
            {/* Form fields */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
            <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </AccountSkeletonShell>
    </main>
  );
}
