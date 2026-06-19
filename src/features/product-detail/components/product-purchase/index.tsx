"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { discountPercent, formatPrice, isOnSale } from "@/lib/pricing";
import { useCartStore } from "@/store/cart.store";
import { useBranchStore } from "@/store/branch.store";
import { resolveDefaultBranch } from "@/services/branch.service";
import type { Branch } from "@/types/branch";
import type { Product, ProductSummary } from "@/types/product";
import { WishlistMenu } from "@/features/product-list/components/wishlist-menu";
import { VariantOptions } from "../variant-options";
import { NotifyStockButton } from "../notify-stock-button";

/** A status dot + label row for branch availability. */
function BranchLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-block size-2 shrink-0 rounded-full",
          ok ? "bg-(--theme-in-stock,#16a34a)" : "bg-(--theme-out-of-stock,var(--destructive))",
        )}
      />
      <span className={cn("text-sm", ok ? "text-muted-foreground" : "font-medium text-foreground")}>
        {label}
      </span>
    </div>
  );
}

/** First value per option that has an in-stock variant (falls back to first value). */
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

export function ProductPurchase({
  product,
  summary,
  branches,
}: {
  product: Product;
  summary: ProductSummary;
  branches: Branch[];
}) {
  const addLine = useCartStore((s) => s.addLine);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branch =
    branches.find((b) => b.id === selectedBranchId) ?? resolveDefaultBranch(branches);

  const [selected, setSelected] = useState<Record<string, string>>(() => defaultSelection(product));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const hasVariants = product.variants.length > 0;

  const variant = useMemo(() => {
    if (!hasVariants) return undefined;
    return product.variants.find((v) =>
      Object.entries(v.options).every(([k, val]) => selected[k] === val),
    );
  }, [hasVariants, product.variants, selected]);

  // A value is available if some in-stock variant has it + matches the other picks.
  const isAvailable = (optionName: string, value: string) => {
    if (!hasVariants) return true;
    return product.variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[optionName] === value &&
        Object.entries(v.options).every(([k, val]) => k === optionName || selected[k] === val),
    );
  };

  const price = variant?.price ?? product.price;
  const sale = isOnSale(price);
  const stock = hasVariants ? (variant?.stock ?? 0) : product.inStock ? 99 : 0;
  const inStock = stock > 0;
  // Per-branch availability for this product.
  const branchStock = product.branchStock ?? [];
  const allBranchesOut = branchStock.length > 0 && branchStock.every((b) => !b.inStock);
  const selectedBranchInStock = branch
    ? (branchStock.find((b) => b.branchId === branch.id)?.inStock ?? false)
    : false;
  const otherInStockBranches = branches.filter(
    (b) => b.id !== branch?.id && branchStock.some((s) => s.branchId === b.id && s.inStock),
  );

  const isPreorder = product.status === "preorder" && !hasVariants;
  // Purchasable only if the SELECTED branch carries it AND the chosen variant has stock.
  const outOfStock = !isPreorder && (!inStock || !selectedBranchInStock);
  const max = stock || 99;
  /** Show a real remaining count (variant stock or genuinely low stock). */
  const showStockCount = inStock && selectedBranchInStock && stock <= 20;

  const pickOption = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    // Stock of the variant we're switching TO — clamp qty so it never exceeds it.
    const nextVariant = hasVariants
      ? product.variants.find((v) => Object.entries(v.options).every(([k, val]) => next[k] === val))
      : undefined;
    const nextStock = hasVariants ? (nextVariant?.stock ?? 0) : product.inStock ? 99 : 0;
    setSelected(next);
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, nextStock)));
    setLimitHit(false);
  };

  const increase = () => {
    if (qty >= max) {
      setLimitHit(true);
      window.setTimeout(() => setLimitHit(false), 1800);
      return;
    }
    setQty((q) => q + 1);
  };

  const onAdd = () => {
    if (outOfStock) return;
    // Safety clamp — qty can never exceed the selected variant's stock.
    const quantity = Math.min(qty, max);
    addLine({
      id: variant ? `${product.id}:${variant.id}` : product.id,
      name: variant ? `${product.name} – ${Object.values(variant.options).join(", ")}` : product.name,
      price: price.amount,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="space-y-5">
      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold tracking-tight text-(--theme-sale-price,inherit)">
          {formatPrice(price.amount, price.currency)}
        </span>
        {sale && (
          <>
            <span className="pb-1 text-base text-muted-foreground line-through">
              {formatPrice(price.compareAt!, price.currency)}
            </span>
            <span className="mb-1 rounded-full bg-(--theme-discount-badge-bg,var(--destructive)) px-2 py-0.5 text-xs font-bold text-(--theme-discount-badge-text,#fff)">
              -{discountPercent(price)}%
            </span>
          </>
        )}
      </div>

      {/* Variant options */}
      {product.options.length > 0 && (
        <VariantOptions
          options={product.options}
          selected={selected}
          onSelect={pickOption}
          isAvailable={isAvailable}
        />
      )}

      {/* Branch availability */}
      {branch && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
          {isPreorder ? (
            <BranchLine ok label={`Đặt trước tại ${branch.name}`} />
          ) : allBranchesOut ? (
            <BranchLine ok={false} label="Tất cả chi nhánh đều hết mặt hàng này" />
          ) : selectedBranchInStock ? (
            <BranchLine ok label={`Còn hàng tại ${branch.name}`} />
          ) : (
            <div className="space-y-2">
              <BranchLine ok={false} label={`Hết hàng tại ${branch.name}`} />
              {otherInStockBranches.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Còn hàng tại:{" "}
                    <span className="font-medium text-foreground">
                      {otherInStockBranches.map((b) => b.name).join(", ")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chọn chi nhánh khác ở đầu trang để mua mặt hàng này.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {outOfStock ? (
        <div className="space-y-2.5">
          <Button size="lg" className="h-11 w-full rounded-lg" disabled>
            Hết hàng
          </Button>
          <div className="flex items-center gap-3">
            <NotifyStockButton productName={product.name} className="flex-1" />
            <WishlistMenu product={summary} className="size-11 rounded-lg border border-border bg-background" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex h-11 items-center rounded-lg border transition",
                limitHit ? "border-(--theme-warning,#d97706) ring-2 ring-(--theme-warning,#d97706)/30" : "border-border",
              )}
            >
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
                onClick={increase}
                aria-label="Tăng"
                className="flex h-full w-10 items-center justify-center text-lg"
              >
                +
              </button>
            </div>

            <Button size="lg" className="h-11 flex-1 rounded-lg text-sm" onClick={onAdd}>
              {added ? "Đã thêm vào giỏ ✓" : isPreorder ? "Đặt trước" : "Thêm vào giỏ"}
            </Button>

            <WishlistMenu product={summary} className="size-11 rounded-lg border border-border bg-background" />
          </div>

          {/* Quantity limit awareness */}
          {limitHit ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-(--theme-warning,#d97706)/40 bg-(--theme-warning,#d97706)/10 px-3 py-2 text-xs font-medium text-(--theme-warning,#b45309)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              Đã đạt tối đa — chỉ còn {stock} sản phẩm.
            </div>
          ) : (
            showStockCount && (
              <p className="text-xs text-muted-foreground">
                Còn <span className="font-medium text-foreground">{stock}</span> sản phẩm
                {qty >= max && " · đã chọn tối đa"}
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
