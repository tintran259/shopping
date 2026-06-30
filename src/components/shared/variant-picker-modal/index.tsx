"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { getProductBySlug } from "@/services/product.service";
import { useCart } from "@/hooks/use-cart";
import { useBranchStore } from "@/store/branch.store";
import { VariantOptions } from "@/features/product-detail/components/variant-options";
import type { Product } from "@/types/product";

/** First in-stock value per option (falls back to the first value). */
function defaultSelection(product: Product): Record<string, string> {
  return Object.fromEntries(
    product.options.map((o) => {
      const inStockVal = o.values.find((v) =>
        product.variants.some((vr) => vr.options[o.name] === v && vr.stock > 0),
      );
      return [o.name, inStockVal ?? o.values[0]];
    }),
  );
}

/**
 * Shopee-style "choose variant" popup for adding a multi-variant product to the
 * cart from outside the PDP (PLP card, wishlist). Fetches the full product on open,
 * lets the shopper pick options + quantity, and respects branch stock − in-cart cap.
 */
export function VariantPickerModal({
  open,
  slug,
  onClose,
}: {
  open: boolean;
  slug: string | null;
  onClose: () => void;
}) {
  const { addLine, lines } = useCart();
  const branchId = useBranchStore((s) => s.selectedBranchId) ?? undefined;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug as string),
    enabled: open && !!slug,
    staleTime: 60_000,
  });

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  const productId = product?.id;
  useEffect(() => {
    if (!product) return;
    // Initialise the picker each time a new product loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(defaultSelection(product));
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const variant = useMemo(() => {
    if (!product) return undefined;
    return product.variants.find((v) =>
      Object.entries(v.options).every(([k, val]) => selected[k] === val),
    );
  }, [product, selected]);

  if (!open) return null;

  const isAvailable = (optionName: string, value: string) =>
    !!product?.variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[optionName] === value &&
        Object.entries(v.options).every(([k, val]) => k === optionName || selected[k] === val),
    );

  const priceObj = variant?.price ?? product?.price;
  const branchEntry = branchId ? variant?.branchStock?.find((b) => b.branchId === branchId) : undefined;
  const branchInStock = branchEntry?.inStock ?? (variant ? variant.stock > 0 : false);
  const branchQty = branchEntry ? (branchEntry.quantity ?? 0) : (variant?.stock ?? 0);
  const inCart = variant
    ? lines.filter((l) => l.variantId === variant.id).reduce((n, l) => n + l.quantity, 0)
    : 0;
  const remaining = Math.max(0, branchQty - inCart);
  const max = Math.max(1, remaining);
  const canAdd = !!variant && branchInStock && remaining > 0;

  const onAdd = () => {
    if (!product || !variant || !canAdd) return;
    const p = variant.price ?? product.price;
    addLine({
      id: `${product.id}:${variant.id}`,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: variant.image ?? product.images?.[0],
      brand: product.brand?.name ?? undefined,
      detail:
        Object.entries(variant.options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ") || undefined,
      price: p.amount,
      compareAt: p.compareAt,
      currency: p.currency,
      quantity: Math.min(qty, max),
      maxStock: max,
      branchStock: product.branchStock,
      rating: product.rating,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chọn phân loại"
        className="relative w-full max-w-md rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {isLoading || !product ? (
          <div className="space-y-4 py-2">
            <div className="flex gap-3">
              <div className="size-20 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-11 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : (
          <>
            {/* Header: image + name + price */}
            <div className="flex gap-3 pr-6">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50">
                {(variant?.image ?? product.images?.[0])?.url && (
                  <Image
                    src={(variant?.image ?? product.images?.[0])!.url}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                {priceObj && (
                  <p className="mt-1 text-lg font-bold tracking-tight text-(--theme-sale-price,inherit)">
                    {formatPrice(priceObj.amount, priceObj.currency)}
                  </p>
                )}
                {variant && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {branchInStock ? `Còn ${branchQty} sản phẩm` : "Hết hàng tại chi nhánh"}
                    {inCart > 0 && ` · đã có ${inCart} trong giỏ`}
                  </p>
                )}
              </div>
            </div>

            {/* Options */}
            {product.options.length > 0 && (
              <div className="mt-4">
                <VariantOptions
                  options={product.options}
                  selected={selected}
                  onSelect={(name, value) => {
                    setSelected((s) => ({ ...s, [name]: value }));
                    setQty(1);
                  }}
                  isAvailable={isAvailable}
                />
              </div>
            )}

            {/* Quantity + add */}
            <div className="mt-5 flex items-center gap-3">
              <div className="inline-flex h-11 items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Giảm"
                  className="flex h-full w-10 items-center justify-center text-lg disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-9 text-center text-sm font-medium tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(q + 1, max))}
                  disabled={qty >= max}
                  aria-label="Tăng"
                  className="flex h-full w-10 items-center justify-center text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <Button size="lg" className="h-11 flex-1 rounded-lg text-sm" onClick={onAdd} disabled={!canAdd}>
                {!variant
                  ? "Chọn phân loại"
                  : !canAdd
                    ? inCart > 0
                      ? "Đã có tối đa trong giỏ"
                      : "Hết hàng"
                    : "Thêm vào giỏ"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
