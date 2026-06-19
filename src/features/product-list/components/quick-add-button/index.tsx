"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useBranchStore } from "@/store/branch.store";
import { BRANCH_IDS } from "@/services/branch.service";
import type { ProductSummary } from "@/types/product";

/**
 * PLP quick-add. Respects the selected branch: if the product is out of stock at
 * the active branch, the button is disabled. Until mounted (and the persisted
 * branch rehydrates) it falls back to overall stock to avoid a hydration flash.
 */
export function QuickAddButton({
  product,
  className,
}: {
  product: ProductSummary;
  className?: string;
}) {
  const addLine = useCartStore((s) => s.addLine);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  const branchId = selectedBranchId ?? BRANCH_IDS[0];
  const availableAtBranch =
    !mounted || !product.branchStock
      ? product.inStock
      : (product.branchStock.find((b) => b.branchId === branchId)?.inStock ?? false);

  const onAdd = () => {
    if (!availableAtBranch) return;
    addLine({ id: product.id, name: product.name, price: product.price.amount, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  if (!availableAtBranch) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-9 w-full items-center justify-center rounded-full bg-muted px-4 text-xs font-semibold text-muted-foreground shadow-sm",
          className,
        )}
      >
        Hết hàng tại chi nhánh
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-foreground/90 px-4 text-xs font-semibold text-background shadow-sm backdrop-blur transition hover:bg-foreground",
        className,
      )}
    >
      {added ? (
        "Đã thêm ✓"
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Thêm vào giỏ
        </>
      )}
    </button>
  );
}
