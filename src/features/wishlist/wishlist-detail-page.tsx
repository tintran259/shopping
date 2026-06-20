"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductLineRow } from "@/components/shared/product-line-row";
import { cartLineFromSummary } from "@/features/cart/utils";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCartStore } from "@/store/cart.store";
import { useBranchStore } from "@/store/branch.store";
import { BRANCH_IDS } from "@/services/branch.service";
import type { ProductSummary } from "@/types/product";

export function WishlistDetailPage({ listId }: { listId: string }) {
  const router = useRouter();
  const list = useWishlistStore((s) => s.lists.find((l) => l.id === listId));
  const renameList = useWishlistStore((s) => s.renameList);
  const removeList = useWishlistStore((s) => s.removeList);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const addLine = useCartStore((s) => s.addLine);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedAll, setAddedAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);

  const branchId = selectedBranchId ?? BRANCH_IDS[0];
  const availOf = (item: ProductSummary) => {
    const entry = item.branchStock?.find((b) => b.branchId === branchId);
    const available = item.branchStock ? (entry?.inStock ?? false) : item.inStock;
    return { available, max: available ? entry?.quantity || 99 : 0 };
  };
  const getQty = (id: string) => qtyMap[id] ?? 1;
  const setQty = (id: string, next: number, max: number) =>
    setQtyMap((m) => ({ ...m, [id]: Math.min(Math.max(1, next), max) }));

  const onDelete = () => {
    removeList(listId);
    router.push("/wishlist");
  };
  const saveName = () => {
    renameList(listId, name);
    setEditing(false);
  };
  const performAddAll = () => {
    if (!list) return;
    let count = 0;
    for (const item of list.items) {
      const { available, max } = availOf(item);
      if (!available) {
        // Out-of-stock items are removed from the list — can't go to the cart.
        toggleItem(listId, item);
        continue;
      }
      addLine(cartLineFromSummary(item, Math.min(getQty(item.id), max), branchId));
      count += 1;
    }
    setConfirmAdd(false);
    if (count) {
      setAddedAll(true);
      window.setTimeout(() => setAddedAll(false), 1800);
    }
  };

  if (!mounted) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
        <div className="mb-8 h-9 w-56 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="size-20 animate-pulse rounded-xl bg-muted sm:size-24" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
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

  const oosCount = list.items.filter((i) => !availOf(i).available).length;
  const availCount = list.items.length - oosCount;
  const anyAvailable = availCount > 0;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <div className="mb-2">
        <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground">
          ← Danh sách yêu thích
        </Link>
      </div>

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

        <div className="flex flex-wrap items-center gap-2">
          {list.items.length > 0 && (
            <Button size="sm" disabled={!anyAvailable} onClick={() => setConfirmAdd(true)}>
              {addedAll ? "Đã thêm vào giỏ ✓" : "Thêm tất cả vào giỏ"}
            </Button>
          )}
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
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
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
        <div className="divide-y divide-border/60 rounded-2xl border border-border/60 px-4">
          {list.items.map((p) => {
            const { available, max } = availOf(p);
            const detail = p.optionPreview
              ? `${p.optionPreview.name}: ${p.optionPreview.values.slice(0, 4).join(" · ")}`
              : undefined;
            return (
              <ProductLineRow
                key={p.id}
                href={`/product/${p.slug}`}
                image={p.thumbnail}
                brand={p.brand?.name}
                name={p.name}
                price={p.price.amount}
                compareAt={p.price.compareAt}
                currency={p.price.currency}
                priceFromLabel={p.priceVaries}
                rating={p.rating}
                badge={p.highlight}
                detail={detail}
                quantity={getQty(p.id)}
                max={max || 1}
                onDecrease={() => setQty(p.id, getQty(p.id) - 1, max || 1)}
                onIncrease={() => setQty(p.id, getQty(p.id) + 1, max || 1)}
                onRemove={() => toggleItem(listId, p)}
                unavailable={!available}
              />
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Xóa danh sách"
        description={`Bạn có thật sự muốn xóa danh sách "${list.name}" không?`}
        confirmLabel="Xóa"
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmAdd}
        title="Thêm tất cả vào giỏ"
        description={
          oosCount > 0
            ? `${oosCount} sản phẩm đã hết hàng tại chi nhánh đang chọn sẽ bị xóa khỏi danh sách. Thêm ${availCount} sản phẩm còn lại vào giỏ?`
            : `Thêm ${availCount} sản phẩm vào giỏ hàng?`
        }
        confirmLabel={oosCount > 0 ? "Xóa hết hàng & thêm vào giỏ" : "Thêm vào giỏ"}
        onConfirm={performAddAll}
        onCancel={() => setConfirmAdd(false)}
      />
    </main>
  );
}
