/** Reusable skeleton wrapper that mirrors AccountShell's sidebar + grid layout. */
export function AccountSkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      {/* Mobile back link placeholder */}
      <div className="mb-4 h-5 w-20 animate-pulse rounded bg-muted lg:hidden" />

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-(--theme-card-background,var(--card))">
            {/* User header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
              <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-36 animate-pulse rounded bg-muted" />
              </div>
              <div className="size-4 animate-pulse rounded bg-muted" />
            </div>
            {/* Nav groups */}
            <div className="space-y-4 p-2 pt-3">
              <div className="space-y-1">
                <div className="h-8 animate-pulse rounded-lg bg-muted" />
              </div>
              <div className="space-y-1">
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-muted/60" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
              <div className="space-y-1">
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted/60" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
              <div className="border-t border-border/60 pt-2">
                <div className="h-8 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
