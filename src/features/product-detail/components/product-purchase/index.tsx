"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/shared/icons";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { discountPercent, formatPrice, isOnSale } from "@/lib/pricing";
import { defaultSelection, findVariant, isOptionValueAvailable } from "@/lib/variant";
import { useCart } from "@/hooks/use-cart";
import { useBranchStore } from "@/store/branch.store";
import { resolveDefaultBranch } from "@/services/branch.service";
import { getProductBySlug } from "@/services/product.service";
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

export function ProductPurchase({
  product,
  summary,
  branches,
}: {
  product: Product;
  summary: ProductSummary;
  branches: Branch[];
}) {
  const { addLine, lines } = useCart();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branch =
    branches.find((b) => b.id === selectedBranchId) ?? resolveDefaultBranch(branches);

  // Live stock: the SSR product is ISR-cached (~60s) so its stock can be stale.
  // Refetch on mount and use the fresh copy for all availability/quantity math.
  const { data: fresh } = useQuery({
    queryKey: ["product", product.slug],
    queryFn: () => getProductBySlug(product.slug),
    staleTime: 30_000,
  });
  const live = fresh ?? product;

  const [selected, setSelected] = useState<Record<string, string>>(() => defaultSelection(product));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const hasVariants = live.variants.length > 0;

  const variant = useMemo(
    () => (hasVariants ? findVariant(live, selected) : undefined),
    [hasVariants, live, selected],
  );

  const isAvailable = (optionName: string, value: string) =>
    !hasVariants || isOptionValueAvailable(live, selected, optionName, value);

  const price = variant?.price ?? live.price;
  const sale = isOnSale(price);
  const stock = hasVariants ? (variant?.stock ?? 0) : live.inStock ? 99 : 0;
  const inStock = stock > 0;

  // Per-branch availability for the SELECTED VARIANT (product-level only as a
  // fallback for simple products). Using the variant's branch stock everywhere
  // keeps "hết hàng" vs "đã có tối đa trong giỏ" consistent — a variant that's out
  // at this branch reads as out-of-stock, not as a maxed cart.
  const branchStock = variant?.branchStock ?? live.branchStock ?? [];
  const allBranchesOut = branchStock.length > 0 && branchStock.every((b) => !b.inStock);
  const branchEntry = branch
    ? branchStock.find((b) => b.branchId === branch.id)
    : undefined;
  const selectedBranchInStock = branchEntry?.inStock ?? false;
  const otherInStockBranches = branches.filter(
    (b) => b.id !== branch?.id && branchStock.some((s) => s.branchId === b.id && s.inStock),
  );

  const isPreorder = live.status === "preorder" && !hasVariants;
  // Purchasable only if the SELECTED branch carries the chosen variant.
  const outOfStock = !isPreorder && (!inStock || !selectedBranchInStock);
  // Remaining for THIS variant at the SELECTED branch (falls back to total stock
  // when per-branch data is absent). Drives the qty cap + the "còn N" line.
  const branchQty = branchEntry ? (branchEntry.quantity ?? 0) : stock;

  // Quantity of THIS variant already in the cart — the cap is stock minus that, so
  // (cart + about-to-add) can never exceed real stock (matches Shopee/Tiki/Amazon).
  const currentVariantId = variant?.id ?? live.variants[0]?.id;
  const inCart = lines
    .filter((l) => l.variantId && l.variantId === currentVariantId)
    .reduce((n, l) => n + l.quantity, 0);
  const remainingAddable = isPreorder ? 99 : Math.max(0, branchQty - inCart);
  const max = Math.max(1, remainingAddable);
  // In stock at the branch, but the cart already holds the entire available stock.
  const atCartLimit = !isPreorder && selectedBranchInStock && remainingAddable === 0;
  /** Show the remaining count whenever the item is buyable at the selected branch. */
  const showStockCount = !isPreorder && selectedBranchInStock && branchQty > 0;

  const pickOption = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    // Stock of the variant we're switching TO — clamp qty so it never exceeds it.
    const nextVariant = hasVariants ? findVariant(live, next) : undefined;
    const nextStock = hasVariants ? (nextVariant?.stock ?? 0) : live.inStock ? 99 : 0;
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
      variantId: variant?.id ?? live.variants[0]?.id,
      slug: product.slug,
      name: product.name,
      image: variant?.image ?? summary.thumbnail,
      brand: product.brand?.name ?? undefined,
      detail: variant
        ? Object.entries(variant.options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")
        : undefined,
      price: price.amount,
      compareAt: price.compareAt,
      currency: price.currency,
      quantity,
      maxStock: max,
      branchStock: product.branchStock,
      rating: summary.rating,
    });
    setAdded(true);
    setQty(1); // reset so the next add respects the reduced remaining
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
      ) : atCartLimit ? (
        <div className="space-y-2.5">
          <Button size="lg" className="h-11 w-full rounded-lg" disabled>
            Đã có tối đa trong giỏ
          </Button>
          <p className="text-xs text-muted-foreground">
            Bạn đã có toàn bộ <span className="font-medium text-foreground">{inCart}</span> sản phẩm
            còn lại trong giỏ. Vào{" "}
            <a href="/cart" className="font-medium text-primary hover:underline">
              giỏ hàng
            </a>{" "}
            để điều chỉnh.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {/* `+` stays enabled at max so hitting it can flash the limit warning. */}
            <QuantityStepper
              size="lg"
              quantity={qty}
              onDecrease={() => setQty((q) => Math.max(1, q - 1))}
              onIncrease={increase}
              decreaseDisabled={qty <= 1}
              className={cn(
                "transition",
                limitHit &&
                  "border-(--theme-warning,#d97706) ring-2 ring-(--theme-warning,#d97706)/30",
              )}
            />

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
              <WarningIcon />
              {inCart > 0
                ? `Bạn đã có ${inCart} trong giỏ — chỉ thêm được ${remainingAddable} sản phẩm nữa.`
                : `Đã đạt tối đa — chỉ còn ${branchQty} sản phẩm.`}
            </div>
          ) : (
            showStockCount && (
              <p className="text-xs text-muted-foreground">
                Còn <span className="font-medium text-foreground">{branchQty}</span> sản phẩm
                {branch ? ` tại ${branch.name}` : ""}
                {inCart > 0 && ` · đã có ${inCart} trong giỏ`}
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
