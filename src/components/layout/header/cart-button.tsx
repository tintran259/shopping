"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { BagIcon } from "./icons";

export function CartButton() {
  const count = useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  return (
    <Link
      href="/cart"
      aria-label={`Cart${count ? `, ${count} items` : ""}`}
      className="relative inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-(--theme-cart-badge-background,var(--primary)) px-1 text-[10px] font-semibold leading-4 text-(--theme-cart-badge-text,var(--primary-foreground))">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
