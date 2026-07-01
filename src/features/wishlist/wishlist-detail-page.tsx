"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductLineRow } from "@/components/shared/product-line-row";
import { cartLineFromSummary } from "@/features/cart/utils";
import { getProductBySlug } from "@/services/product.service";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useBranchStore } from "@/store/branch.store";
import { toast } from "@/store/toast.store";
import type { WishlistItem } from "@/store/wishlist.store";
import type { CartLine } from "@/store/cart.store";
import type { BranchStock } from "@/types/product";

export function WishlistDetailPage({ listId }: { listId: string }) {
  const router = useRouter();
  const { lists, ready, renameList, removeList, toggleItem } = useWishlist();
  const list = lists.find((l) => l.id === listId);
  const { addLine, lines: cartLines } = useCart();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedAll, setAddedAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);

  const branchId = selectedBranchId ?? undefined;
  // The variant to buy: the one saved with the item, else the product's default.
  const variantOf = (item: WishlistItem) => item.variantId ?? item.defaultVariantId;
  // A variant item can be added straight to cart; a variant-product saved without
  // a variant (legacy) still needs the picker.
  const needsVariantChoice = (item: WishlistItem) => !!item.optionPreview && !item.variantId;

  // Verify against LIVE stock: the saved branchStock is a snapshot (stale for
  // guests). Refetch the listed products and read each variant's fresh stock so we
  // don't let the user add more than is actually available.
  const slugs = useMemo(
    () => [...new Set((list?.items ?? []).map((i) => i.slug))],
    [list],
  );
  const stockQuery = useQuery({
    queryKey: ["wishlist-stock", listId, slugs.join(",")],
    queryFn: () => Promise.all(slugs.map((s) => getProductBySlug(s))),
    enabled: slugs.length > 0,
    staleTime: 30_000,
  });
  const freshStockByVariant = useMemo(() => {
    const m = new Map<string, BranchStock[]>();
    for (const p of stockQuery.data ?? []) {
      if (!p) continue;
      for (const v of p.variants) if (v.branchStock) m.set(v.id, v.branchStock);
    }
    return m;
  }, [stockQuery.data]);

  // `max` = how many MORE can be added = branch stock − what's already in the cart.
  const inCartOf = (item: WishlistItem) => {
    const vId = variantOf(item);
    return vId
      ? cartLines.filter((l) => l.variantId === vId).reduce((n, l) => n + l.quantity, 0)
      : 0;
  };
  const availOf = (item: WishlistItem) => {
    const vId = variantOf(item);
    // Live stock when loaded, else fall back to the saved snapshot.
    const branchStock = (vId && freshStockByVariant.get(vId)) || item.branchStock;
    const entry = branchId ? branchStock?.find((b) => b.branchId === branchId) : undefined;
    const available = !branchStock || !branchId ? item.inStock : (entry?.inStock ?? false);
    const stockCap = available ? entry?.quantity || 99 : 0;
    return { available, max: Math.max(0, stockCap - inCartOf(item)) };
  };
  // Build a cart line for a wishlist item, pinning the saved variant (id + label).
  const toCartLine = (item: WishlistItem, qty: number): CartLine => {
    const line = cartLineFromSummary(item, qty, branchId);
    if (item.variantId) {
      line.variantId = item.variantId;
      line.detail = item.variantLabel ?? line.detail;
    }
    return line;
  };
  const getQty = (id: string) => qtyMap[id] ?? 1;
  const setQty = (id: string, next: number, max: number) =>
    setQtyMap((m) => ({ ...m, [id]: Math.min(Math.max(1, next), max) }));

  /** Remove every item that's out of stock at the selected branch. */
  const removeOos = () => {
    for (const item of list?.items ?? []) {
      if (!availOf(item).available) toggleItem(listId, item);
    }
  };

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
    let added = 0;
    let skipped = 0;
    let variantSkipped = 0;
    for (const item of list.items) {
      const { available, max } = availOf(item);
      if (!available) {
        // Out-of-stock items are removed from the list — can't go to the cart.
        toggleItem(listId, item);
        continue;
      }
      if (needsVariantChoice(item)) {
        // Variant product saved without a variant — must be chosen via the picker.
        variantSkipped += 1;
        continue;
      }
      if (max <= 0) {
        // In stock but the cart already holds all available — skip (keep in list).
        skipped += 1;
        continue;
      }
      addLine(toCartLine(item, Math.min(getQty(item.id), max)));
      added += 1;
    }
    setConfirmAdd(false);
    if (added) {
      setAddedAll(true);
      window.setTimeout(() => setAddedAll(false), 1800);
    }
    if (variantSkipped)
      toast.info(`${variantSkipped} sản phẩm có phân loại — chọn phân loại ở từng sản phẩm`);
    if (skipped) toast.info(`${skipped} sản phẩm đã có đủ trong giỏ`);
  };

  if (!ready) {
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
  // Addable = in stock, still room in cart, and not a legacy variant-less entry.
  const availCount = list.items.filter((i) => {
    const a = availOf(i);
    return a.available && !needsVariantChoice(i) && a.max > 0;
  }).length;
  // In stock but the cart already holds all available for that item.
  const maxedCount = list.items.filter((i) => {
    const a = availOf(i);
    return a.available && !needsVariantChoice(i) && a.max <= 0;
  }).length;
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
            <Button
              size="sm"
              disabled={!anyAvailable || oosCount > 0 || maxedCount > 0}
              onClick={() => setConfirmAdd(true)}
            >
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

      {oosCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--theme-out-of-stock,var(--destructive))/30 bg-(--theme-out-of-stock,var(--destructive))/5 px-4 py-3">
          <p className="text-sm text-(--theme-out-of-stock,var(--destructive))">
            <span className="font-semibold">{oosCount} sản phẩm</span> đã hết hàng tại chi nhánh
            đang chọn — xóa để thêm tất cả vào giỏ.
          </p>
          <Button variant="destructive" size="sm" onClick={removeOos}>
            Xóa sản phẩm hết hàng
          </Button>
        </div>
      )}

      {oosCount === 0 && maxedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--theme-warning,#d97706)/40 bg-(--theme-warning,#d97706)/10 px-4 py-3">
          <p className="text-sm text-(--theme-warning,#b45309)">
            <span className="font-semibold">{maxedCount} sản phẩm</span> đã có tối đa trong giỏ —
            điều chỉnh trong giỏ hàng trước khi thêm.
          </p>
          <Link href="/cart" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Xem giỏ hàng
          </Link>
        </div>
      )}

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
            // In stock at the branch but nothing left to add (all already in cart):
            // show "đã có tối đa trong giỏ" (not "hết hàng"). Remaining reads "Còn 0"
            // but the quantity stepper stays at 1 (never a confusing "0"). True branch
            // OOS is handled by `unavailable` below.
            const maxedInCart = available && max <= 0;
            const detail =
              p.variantLabel ??
              (p.optionPreview
                ? `${p.optionPreview.name}: ${p.optionPreview.values.slice(0, 4).join(" · ")}`
                : undefined);
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
                quantity={Math.max(1, Math.min(getQty(p.id), max))}
                max={max}
                onDecrease={() => setQty(p.id, getQty(p.id) - 1, Math.max(1, max))}
                onIncrease={() => setQty(p.id, getQty(p.id) + 1, max)}
                onRemove={() => toggleItem(listId, p)}
                unavailable={!available}
                showRemaining
                note={maxedInCart ? "Đã có tối đa trong giỏ" : undefined}
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
