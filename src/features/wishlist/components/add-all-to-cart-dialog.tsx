"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * "Add all to cart" modal for a wishlist. Beyond confirming the add, it lets the
 * user decide what happens to the list afterwards via two side-by-side actions:
 * "Thêm vào giỏ" (keep the list) or "Thêm & xóa danh sách" (delete it once the
 * items have moved into the cart). The choice is signalled through
 * `onConfirm(deleteAfter)`.
 */
export function AddAllToCartDialog({
  open,
  itemCount,
  oosCount,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  /** How many items will actually be added. */
  itemCount: number;
  /** OOS items that will be dropped from the list first (may be 0). */
  oosCount: number;
  onConfirm: (deleteAfter: boolean) => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Thêm tất cả vào giỏ"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 className="text-base font-semibold">Thêm tất cả vào giỏ</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {oosCount > 0
            ? `${oosCount} sản phẩm đã hết hàng tại chi nhánh đang chọn sẽ bị xóa khỏi danh sách. Thêm ${itemCount} sản phẩm còn lại vào giỏ?`
            : `Thêm ${itemCount} sản phẩm vào giỏ hàng?`}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {/* Two side-by-side actions: keep the list, or delete it after adding. */}
          <div className="flex items-center gap-2">
            <Button size="sm" className="flex-1" onClick={() => onConfirm(false)}>
              Thêm vào giỏ
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => onConfirm(true)}
            >
              Thêm & xóa danh sách
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
