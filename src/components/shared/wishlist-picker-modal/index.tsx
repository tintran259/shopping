"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { getProductBySlug } from "@/services/product.service";
import { useWishlist } from "@/hooks/use-wishlist";
import { VariantOptions } from "@/features/product-detail/components/variant-options";
import type { Product, ProductVariant } from "@/types/product";
import type { WishlistItem } from "@/store/wishlist.store";

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

/** Build the variant-specific wishlist entry (composite id + variant price/label). */
function buildItem(product: Product, variant: ProductVariant): WishlistItem {
  return {
    id: `${product.id}:${variant.id}`,
    slug: product.slug,
    name: product.name,
    thumbnail: variant.image ?? product.images?.[0] ?? { url: "", alt: product.name },
    price: variant.price,
    priceVaries: false,
    brand: product.brand,
    rating: product.rating,
    flags: product.flags ?? {},
    inStock: variant.branchStock?.some((b) => b.inStock) ?? variant.stock > 0,
    branchStock: variant.branchStock ?? product.branchStock,
    status: product.status,
    optionPreview: product.optionPreview,
    variantId: variant.id,
    variantLabel: Object.values(variant.options).join(" · ") || undefined,
  };
}

/**
 * "Save to wishlist" popup for multi-variant products: pick a variant first, then
 * choose which list(s) to save it into (or create one). Each variant is its own
 * saved entry. No quantity — a wishlist entry is always one item.
 */
export function WishlistPickerModal({
  open,
  slug,
  onClose,
}: {
  open: boolean;
  slug: string | null;
  onClose: () => void;
}) {
  const { lists, toggleItem, createList } = useWishlist();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug as string),
    enabled: open && !!slug,
    staleTime: 60_000,
  });

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [name, setName] = useState("");

  const productId = product?.id;
  useEffect(() => {
    if (!product) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(defaultSelection(product));
    setName("");
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

  const variant = useMemo(
    () =>
      product?.variants.find((v) =>
        Object.entries(v.options).every(([k, val]) => selected[k] === val),
      ),
    [product, selected],
  );

  if (!open) return null;

  const item = product && variant ? buildItem(product, variant) : null;
  const isAvailable = (optionName: string, value: string) =>
    !!product?.variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[optionName] === value &&
        Object.entries(v.options).every(([k, val]) => k === optionName || selected[k] === val),
    );

  const create = async () => {
    const n = name.trim();
    if (!n || !item) return;
    setName("");
    toggleItem(await createList(n), item);
  };

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lưu vào danh sách yêu thích"
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
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : (
          <>
            <div className="flex gap-3 pr-6">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50">
                {(variant?.image ?? product.images?.[0])?.url && (
                  <Image
                    src={(variant?.image ?? product.images?.[0])!.url}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                {(variant?.price ?? product.price) && (
                  <p className="mt-1 text-base font-bold tracking-tight text-(--theme-sale-price,inherit)">
                    {formatPrice((variant?.price ?? product.price).amount, (variant?.price ?? product.price).currency)}
                  </p>
                )}
              </div>
            </div>

            {product.options.length > 0 && (
              <div className="mt-4">
                <VariantOptions
                  options={product.options}
                  selected={selected}
                  onSelect={(n, v) => setSelected((s) => ({ ...s, [n]: v }))}
                  isAvailable={isAvailable}
                />
              </div>
            )}

            {/* Lists */}
            <div className="mt-4 border-t border-border/70 pt-3">
              <p className="mb-2 text-sm font-semibold">Lưu vào danh sách</p>
              <ul className="max-h-48 space-y-1 overflow-auto">
                {lists.length === 0 && (
                  <li className="px-1 py-2 text-center text-xs text-muted-foreground">
                    Chưa có danh sách. Tạo một danh sách bên dưới.
                  </li>
                )}
                {lists.map((l) => {
                  const checked = !!item && l.items.some((i) => i.id === item.id);
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        disabled={!item}
                        onClick={() => item && toggleItem(l.id, item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-muted disabled:opacity-50",
                          checked && "bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition border-(--theme-checkbox-border,var(--border))",
                            checked &&
                              "border-transparent bg-(--theme-checkbox-background,var(--primary)) text-(--theme-checkbox-icon,var(--primary-foreground))",
                          )}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 truncate">{l.name}</span>
                        <span className="text-xs text-muted-foreground">{l.items.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-2 flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && create()}
                  placeholder="Tạo danh sách mới…"
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <Button size="sm" className="h-9 shrink-0 rounded-lg" onClick={create} disabled={!name.trim() || !item}>
                  Tạo
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
