"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/wishlist.store";
import { HeartIcon } from "./icons";

export function WishlistButton() {
  // Distinct products saved across all lists.
  const count = useWishlistStore(
    (s) => new Set(s.lists.flatMap((l) => l.items.map((i) => i.id))).size,
  );
  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist${count ? `, ${count} items` : ""}`}
      className="relative hidden size-9 items-center justify-center rounded-md hover:bg-muted sm:inline-flex"
    >
      <HeartIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-(--theme-wishlist-color,var(--primary)) px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
