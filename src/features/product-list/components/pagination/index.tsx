"use client";

import { cn } from "@/lib/utils";
import { useProductFilters } from "../../hooks/use-product-filters";

/** Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 12. */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

const arrow =
  "inline-flex size-10 items-center justify-center rounded-full border border-border text-sm transition disabled:opacity-30 enabled:hover:border-foreground/40 enabled:hover:bg-muted";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { setValue, isPending } = useProductFilters();
  if (totalPages <= 1) return null;

  const go = (p: number) => setValue("page", p <= 1 ? null : String(p));

  return (
    <nav
      aria-label="Phân trang"
      className={cn("flex items-center justify-center gap-2 transition", isPending && "opacity-50")}
    >
      <button onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước" className={arrow}>
        ‹
      </button>

      <div className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full text-sm font-medium transition",
                p === page
                  ? "bg-foreground text-background shadow-sm"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Trang sau" className={arrow}>
        ›
      </button>
    </nav>
  );
}
