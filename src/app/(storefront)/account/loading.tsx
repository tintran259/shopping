export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <div className="w-full">
        {/* Mobile: profile card skeleton */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) px-4 py-4 lg:hidden">
          <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
        {/* Mobile: nav skeleton */}
        <div className="mt-4 space-y-1 rounded-2xl border border-border p-2 lg:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* Sidebar */}
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-(--theme-card-background,var(--card))">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
              <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-36 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-4 p-2 pt-3">
              <div className="h-8 animate-pulse rounded-lg bg-muted" />
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

          {/* Dashboard content */}
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-7 w-10 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="size-12 animate-pulse rounded-xl bg-muted" />
                </div>
              ))}
            </div>

            {/* Orders + Addresses */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              {/* Recent orders */}
              <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="divide-y divide-border/60">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="h-10 w-14 animate-pulse rounded-xl bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                      <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
