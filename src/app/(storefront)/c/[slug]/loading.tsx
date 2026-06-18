import { ProductGridSkeleton } from "@/features/product-list/components/product-grid";

/**
 * Route-level skeleton — shown while the server page re-fetches on first load
 * and on every filter/sort/page navigation (URL change re-runs the segment).
 * Mirrors the PLP layout so the swap to real content is visually stable.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="hidden space-y-6 lg:block">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ))}
        </aside>

        <section className="min-w-0">
          <div className="mb-4 h-8 w-full animate-pulse rounded bg-muted" />
          <ProductGridSkeleton count={12} />
        </section>
      </div>
    </main>
  );
}
