"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import type { ProductSummary } from "@/types/product";

/**
 * PLP quick-add. Out-of-stock renders nothing (the card shows its own overlay).
 * Products with real variants should be configured on the PDP; mock products
 * carry no concrete variants yet, so quick-add always applies here.
 */
export function QuickAddButton({
  product,
  className,
}: {
  product: ProductSummary;
  className?: string;
}) {
  const addLine = useCartStore((s) => s.addLine);
  const [added, setAdded] = useState(false);

  if (!product.inStock) return null;

  const onAdd = () => {
    addLine({ id: product.id, name: product.name, price: product.price.amount, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

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
