"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { baseProductId } from "@/store/wishlist.store";
import { WishlistPickerModal } from "@/components/shared/wishlist-picker-modal";
import type { ProductSummary } from "@/types/product";

const PANEL_W = 288;

/**
 * Heart trigger + dropdown to save a product into one or more named wishlists
 * (or create a new list on the spot). Portaled so it escapes the card's
 * `overflow-hidden`. Heart is filled when the product is in any list.
 */
export function WishlistMenu({
  product,
  className,
}: {
  product: ProductSummary;
  className?: string;
}) {
  const { lists, toggleItem, createList } = useWishlist();
  // Filled when ANY variant of this product is saved (base product id match).
  const inAny = lists.some((l) => l.items.some((i) => baseProductId(i.id) === product.id));
  // Products with a variant axis need a variant chosen first → use the modal.
  const hasOptions = !!product.optionPreview;

  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [name, setName] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasOptions) {
      setPickerOpen(true); // variant products: choose a variant in the modal first
      return;
    }
    if (open) return setOpen(false);
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.max(8, Math.min(rect.right - PANEL_W, window.innerWidth - PANEL_W - 8));
      setPos({ top: rect.bottom + 8, left });
    }
    setOpen(true);
  };

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    setName("");
    toggleItem(await createList(n), product);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lưu vào danh sách yêu thích"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition hover:bg-background",
          className,
        )}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition",
            inAny
              ? "fill-(--theme-wishlist-color,var(--destructive)) stroke-(--theme-wishlist-color,var(--destructive))"
              : "fill-none stroke-foreground/70",
          )}
          aria-hidden
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left, width: PANEL_W }}
              className="fixed z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-border/70 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">Lưu vào danh sách</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="-mr-1 -mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Lists */}
              <ul className="max-h-56 overflow-auto p-1.5">
                {lists.length === 0 && (
                  <li className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                    Chưa có danh sách. Tạo một danh sách bên dưới.
                  </li>
                )}
                {lists.map((l) => {
                  const checked = l.items.some((i) => i.id === product.id);
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(l.id, product)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-muted",
                          checked && "bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition border-(--theme-checkbox-border,var(--border))",
                            checked &&
                              "border-transparent bg-(--theme-checkbox-background,var(--primary)) text-(--theme-checkbox-icon,var(--primary-foreground))",
                          )}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className={cn("flex-1 truncate", checked && "font-medium")}>{l.name}</span>
                        <span className="text-xs text-muted-foreground">{l.items.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Create new list */}
              <div className="border-t border-border/70 p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && create()}
                    placeholder="Tạo danh sách mới…"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <Button size="sm" className="h-9 shrink-0 rounded-lg" onClick={create} disabled={!name.trim()}>
                    Tạo
                  </Button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {hasOptions && (
        <WishlistPickerModal
          open={pickerOpen}
          slug={product.slug}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
