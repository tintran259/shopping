import { cn } from "@/lib/utils";
import type { ProductReview } from "@/types/product";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={s <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(s <= rating ? "text-(--theme-rating,#f59e0b)" : "text-muted-foreground/30")}
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ReviewCard({
  review,
  shopLogoUrl,
}: {
  review: ProductReview;
  shopLogoUrl?: string | null;
}) {
  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{review.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRow rating={review.rating} />
          {review.verified && (
            <span className="rounded-full bg-(--theme-in-stock,#16a34a)/10 px-2 py-0.5 text-[10px] font-semibold text-(--theme-in-stock,#15803d)">
              Đã mua
            </span>
          )}
        </div>
      </div>

      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {review.comment && (
        <p className="text-sm leading-relaxed text-foreground/80">{review.comment}</p>
      )}

      {review.imageUrls && review.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.imageUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt={`Ảnh đánh giá ${i + 1}`}
                className="size-16 rounded-lg object-cover ring-1 ring-border transition hover:opacity-80 sm:size-20"
              />
            </a>
          ))}
        </div>
      )}

      {review.reply && (
        <div className="ml-2 mt-1 flex gap-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
          <div className="mt-0.5 shrink-0">
            {shopLogoUrl ? (
              <img
                src={shopLogoUrl}
                alt="Shop"
                className="size-6 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                S
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Phản hồi từ Shop</span>
              {review.repliedAt && (
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(review.repliedAt)}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{review.reply}</p>
          </div>
        </div>
      )}
    </div>
  );
}
