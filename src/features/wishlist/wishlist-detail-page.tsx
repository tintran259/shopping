"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist.store";
import { ProductCard } from "@/features/product-list/components/product-card";
import { ProductGridSkeleton } from "@/features/product-list/components/product-grid";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function WishlistDetailPage({ listId }: { listId: string }) {
  const router = useRouter();
  const list = useWishlistStore((s) => s.lists.find((l) => l.id === listId));
  const renameList = useWishlistStore((s) => s.renameList);
  const removeList = useWishlistStore((s) => s.removeList);

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const onDelete = () => {
    removeList(listId);
    router.push("/wishlist");
  };
  const saveName = () => {
    renameList(listId, name);
    setEditing(false);
  };

  const backLink = (
    <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground">
      ← Danh sách yêu thích
    </Link>
  );

  if (!mounted) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
        <div className="mb-8 h-9 w-56 animate-pulse rounded bg-muted" />
        <ProductGridSkeleton count={8} />
      </main>
    );
  }

  if (!list) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 text-center">
        <p className="text-base font-medium">Không tìm thấy danh sách</p>
        <Link href="/wishlist" className={cn(buttonVariants(), "mt-4")}>
          Về danh sách yêu thích
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <div className="mb-2">{backLink}</div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="h-10 rounded-lg border border-border bg-background px-3 text-xl font-bold focus:border-primary focus:outline-none"
              />
              <Button size="sm" onClick={saveName}>
                Lưu
              </Button>
            </div>
          ) : (
            <h1 className="truncate text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
              {list.name}
            </h1>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{list.items.length} sản phẩm</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setName(list.name);
                setEditing(true);
              }}
            >
              Đổi tên
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDelete}>
            Xóa danh sách
          </Button>
        </div>
      </header>

      {list.items.length === 0 ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-medium">Danh sách trống</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Nhấn trái tim trên sản phẩm và chọn “{list.name}” để lưu vào đây.
          </p>
          <Link href="/c/dac-san" className={cn(buttonVariants(), "mt-2")}>
            Khám phá đặc sản
          </Link>
        </div>
      ) : (
        <div className={GRID}>
          {list.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
