import { AccountSkeletonShell } from "@/features/account/components/account-skeleton-shell";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountSkeletonShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
                  <div className="h-8 w-14 animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccountSkeletonShell>
    </main>
  );
}
