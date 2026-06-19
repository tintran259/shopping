"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice, isOnSale } from "@/lib/pricing";
import type { OptionPreview, ProductSummary } from "@/types/product";
import { colorHex } from "../../utils/swatch";
import { QuickAddButton } from "../quick-add-button";
import { WishlistMenu } from "../wishlist-menu";

/** Primary variant axis preview: color dots (swatch) or a compact value list. */
function OptionPreviewRow({ preview }: { preview: OptionPreview }) {
  if (preview.displayType === "swatch") {
    return (
      <span className="ml-auto flex items-center gap-1">
        {preview.values.slice(0, 4).map((v) => (
          <span
            key={v}
            title={v}
            className="size-3 rounded-full ring-1 ring-border"
            style={{ backgroundColor: colorHex(v) }}
          />
        ))}
      </span>
    );
  }
  return (
    <span className="ml-auto truncate text-xs text-muted-foreground">
      {preview.values.slice(0, 3).join(" · ")}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const { price } = product;
  const sale = isOnSale(price);
  const percent = discountPercent(price);

  return (
    <div className="group flex flex-col rounded-2xl bg-(--theme-card-background,transparent) p-2 transition hover:shadow-sm">
      {/* Media */}
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50 transition group-hover:ring-border">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          {product.thumbnail?.url ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition duration-500 ease-out group-hover:scale-105",
                !product.inStock && "opacity-50 grayscale",
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span className="text-[11px]">Chưa có ảnh</span>
            </div>
          )}
        </Link>

        {/* Badges (top-left stack) */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1">
          {sale && (
            <span className="rounded-full bg-(--theme-discount-badge-bg,var(--destructive)) px-2 py-0.5 text-[11px] font-bold text-(--theme-discount-badge-text,#fff) shadow-sm">
              -{percent}%
            </span>
          )}
          {product.flags.isNew && (
            <span className="rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
              Mới
            </span>
          )}
          {product.flags.isBestSeller && !product.flags.isNew && (
            <span className="rounded-full bg-foreground/85 px-2 py-0.5 text-[11px] font-semibold text-background shadow-sm backdrop-blur">
              Bán chạy
            </span>
          )}
          {product.highlight && (
            <span className="rounded-full bg-(--theme-success,#059669) px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              {product.highlight}
            </span>
          )}
          {product.status === "preorder" && (
            <span className="rounded-full bg-(--theme-info,#0ea5e9) px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Đặt trước
            </span>
          )}
        </div>

        {/* Wishlist (top-right) */}
        <div className="absolute right-2.5 top-2.5 z-10">
          <WishlistMenu product={product} />
        </div>

        {/* Quick-add: revealed on hover (desktop), always visible (mobile) */}
        {product.inStock ? (
          <div className="absolute inset-x-2.5 bottom-2.5 transition duration-300 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
            <QuickAddButton product={product} />
          </div>
        ) : (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/75 py-1.5 text-center text-xs font-medium text-background backdrop-blur">
            Hết hàng
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-1 flex-col px-0.5">
        {product.brand && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand.name}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-1.5 flex items-center gap-2">
          {product.rating && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <span aria-hidden className="text-(--theme-rating,#f59e0b)">★</span>
              {product.rating.average.toFixed(1)}
              <span className="text-muted-foreground/70">({product.rating.count})</span>
            </span>
          )}
          {product.optionPreview && <OptionPreviewRow preview={product.optionPreview} />}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          {product.priceVaries && (
            <span className="text-xs text-muted-foreground">Từ</span>
          )}
          <span
            className={cn(
              "text-[15px] font-bold tracking-tight",
              sale
                ? "text-(--theme-sale-price,var(--destructive))"
                : "text-(--theme-price,inherit)",
            )}
          >
            {formatPrice(price.amount, price.currency)}
          </span>
          {sale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(price.compareAt!, price.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
