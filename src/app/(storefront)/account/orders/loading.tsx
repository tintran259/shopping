import { AccountSkeletonShell } from "@/features/account/components/account-skeleton-shell";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountSkeletonShell>
        <div className="space-y-4">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-muted" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-4">
              {/* Fan thumbnail placeholder */}
              <div className="h-11 w-14 animate-pulse rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
              <div className="shrink-0 space-y-1.5 text-right">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </AccountSkeletonShell>
    </main>
  );
}
