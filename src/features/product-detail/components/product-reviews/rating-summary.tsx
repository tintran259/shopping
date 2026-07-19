import { cn } from "@/lib/utils";
import type { ProductReviewsResult } from "@/types/product";

function StarBar({
  star,
  count,
  total,
  active,
  onClick,
}: {
  star: number;
  count: number;
  total: number;
  active: boolean;
  onClick: (star: number) => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={() => onClick(star)}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-1.5 py-0.5 text-xs transition-colors",
        active
          ? "bg-(--theme-rating,#f59e0b)/15 ring-1 ring-(--theme-rating,#f59e0b)/40"
          : "hover:bg-muted/60",
      )}
    >
      <span className="w-3 shrink-0 text-right text-muted-foreground">{star}</span>
      <span aria-hidden className="text-[10px] text-(--theme-rating,#f59e0b)">★</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-(--theme-rating,#f59e0b) transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* min-w handles 1–4 digit counts without overflowing */}
      <span className="min-w-8 shrink-0 text-right tabular-nums text-muted-foreground">
        {count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : count}
      </span>
    </button>
  );
}

export function RatingSummary({
  /** Always the full unfiltered distribution + overall average. */
  result,
  activeStar,
  onStarClick,
}: {
  result: ProductReviewsResult;
  activeStar: number;
  onStarClick: (star: number) => void;
}) {
  const sorted = [...result.distribution].sort((a, b) => b.star - a.star);
  const total = result.distribution.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* Big average */}
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-5xl font-bold tracking-tight">
          {result.average.toFixed(1)}
        </span>
        <div className="mt-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={s <= Math.round(result.average) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                s <= Math.round(result.average)
                  ? "text-(--theme-rating,#f59e0b)"
                  : "text-muted-foreground/30"
              }
              aria-hidden
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          {total.toLocaleString("vi-VN")} đánh giá
        </span>
      </div>

      {/* Distribution bars — each is a clickable filter shortcut */}
      <div className="w-full max-w-xs space-y-0.5 sm:max-w-none">
        {sorted.map(({ star, count }) => (
          <StarBar
            key={star}
            star={star}
            count={count}
            total={total}
            active={activeStar === star}
            onClick={onStarClick}
          />
        ))}
      </div>
    </div>
  );
}
