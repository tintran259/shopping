"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductReviews } from "@/services/product.service";
import type { ProductRating, ProductReview } from "@/types/product";
import { RatingSummary } from "./rating-summary";
import { ReviewCard } from "./review-card";

const PAGE_SIZE = 10;
const STARS = [5, 4, 3, 2, 1] as const;

// ── Skeletons ────────────────────────────────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="flex gap-3 py-4 first:pt-0">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProductReviews({
  slug,
  rating,
  shopLogoUrl,
}: {
  slug: string;
  rating?: ProductRating;
  shopLogoUrl?: string | null;
}) {
  const [starFilter, setStarFilter] = useState(0); // 0 = all
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<ProductReview[]>([]);

  const { data, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["product-reviews", slug, page, starFilter],
    queryFn: () =>
      fetchProductReviews(slug, page, PAGE_SIZE, starFilter || undefined),
    staleTime: 2 * 60_000,
    // Keep previous page visible while next page loads (prevents flicker on
    // load-more). isPlaceholderData tells us when to skip accumulation.
    placeholderData: (prev) => prev,
  });

  // Accumulate reviews for load-more.
  // Skip when React Query is still serving stale placeholder data — the real
  // fresh batch hasn't arrived yet, so we'd be appending the wrong page.
  useEffect(() => {
    if (!data || isPlaceholderData) return;
    setAccumulated((prev) =>
      page === 1 ? data.reviews : [...prev, ...data.reviews],
    );
  }, [data, isPlaceholderData, page]);

  // The BE always runs getDistribution without a star filter, so
  // data.distribution is the full histogram regardless of the active filter.
  // We derive the unfiltered total and average from it directly.
  const dist = data?.distribution ?? [];
  const baseTotal = dist.reduce((s, d) => s + d.count, 0);
  const baseAvg =
    baseTotal > 0
      ? dist.reduce((s, d) => s + d.star * d.count, 0) / baseTotal
      : (data?.average ?? 0);

  const filteredTotal = data?.total ?? 0; // count for the active star filter
  const hasMore = accumulated.length < filteredTotal;
  const isInitialLoad = isFetching && accumulated.length === 0;
  const isLoadingMore = isFetching && accumulated.length > 0;

  const handleStarFilter = (star: number) => {
    const next = star === starFilter ? 0 : star;
    setStarFilter(next);
    setPage(1);
    setAccumulated([]); // clear immediately → show skeleton while API responds
  };

  const loadMore = () => setPage((p) => p + 1);

  // Hide entire section when there are truly no reviews (and no cached rating).
  if (!isInitialLoad && baseTotal === 0 && !rating?.count) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Đánh giá từ khách hàng</h2>
        {baseTotal > 0 && (
          <span className="text-sm text-muted-foreground">
            {baseTotal.toLocaleString("vi-VN")} đánh giá
          </span>
        )}
      </div>

      {/* Rating summary + clickable distribution bars */}
      {baseTotal > 0 && data && (
        <div className="mb-4 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
          <RatingSummary
            result={{ ...data, average: baseAvg, total: baseTotal }}
            activeStar={starFilter}
            onStarClick={handleStarFilter}
          />
        </div>
      )}

      {/* Star filter chips */}
      {baseTotal > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleStarFilter(0)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              starFilter === 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            Tất cả
            <span className="ml-1 tabular-nums opacity-70">
              ({baseTotal.toLocaleString("vi-VN")})
            </span>
          </button>

          {STARS.map((star) => {
            const count = dist.find((d) => d.star === star)?.count ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarFilter(star)}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                  starFilter === star
                    ? "border-(--theme-rating,#f59e0b) bg-(--theme-rating,#f59e0b)/10 text-(--theme-rating,#b45309)"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {star}
                <span aria-hidden className="text-(--theme-rating,#f59e0b)">★</span>
                <span className="ml-0.5 tabular-nums opacity-70">
                  ({count.toLocaleString("vi-VN")})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Review list */}
      <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
        {isInitialLoad ? (
          <ListSkeleton count={Math.min(PAGE_SIZE, 5)} />
        ) : accumulated.length === 0 ? (
          <div className="py-8 text-center">
            {starFilter > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Chưa có đánh giá {starFilter}★ nào.
                </p>
                <button
                  type="button"
                  onClick={() => handleStarFilter(0)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Xem tất cả đánh giá
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có đánh giá nào. Hãy là người đầu tiên!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {accumulated.map((r) => (
                <ReviewCard key={r.id} review={r} shopLogoUrl={shopLogoUrl} />
              ))}
            </div>

            {/* Load-more skeleton appended below existing reviews */}
            {isLoadingMore && (
              <div className="border-t border-border/60">
                <ListSkeleton count={3} />
              </div>
            )}

            {/* Footer: progress + load-more */}
            <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Đang hiển thị{" "}
                <span className="font-medium text-foreground">
                  {accumulated.length.toLocaleString("vi-VN")}
                </span>{" "}
                /{" "}
                <span className="font-medium text-foreground">
                  {filteredTotal.toLocaleString("vi-VN")}
                </span>{" "}
                đánh giá
                {starFilter > 0 && (
                  <span className="ml-1 text-muted-foreground/60">
                    ({starFilter}★)
                  </span>
                )}
              </p>

              {hasMore && !isLoadingMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="rounded-full border border-border px-5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                >
                  Xem thêm{" "}
                  {Math.min(PAGE_SIZE, filteredTotal - accumulated.length).toLocaleString("vi-VN")}{" "}
                  đánh giá
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
