import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BranchStock } from "@/types/product";

/**
 * A cart line is keyed by the purchasable unit — `productId` for a simple product,
 * or `productId:variantId` for a variant. It carries enough display + inventory data
 * to render the cart (and the shared `ProductLineRow`) and to re-check per-branch
 * availability live, WITHOUT refetching. Server state (real pricing, stock) still
 * lives in React Query / the BE; this is only the client cart snapshot.
 */
export interface CartLine {
  id: string;
  /** Purchasable variant id — required to sync the line to the BE cart. */
  variantId?: string;
  slug: string;
  name: string;
  image?: { url?: string; alt?: string };
  brand?: string;
  /** Variant label, e.g. "Quy cách: 500g". */
  detail?: string;
  price: number;
  compareAt?: number | null;
  currency: string;
  quantity: number;
  /** Hard cap for this line (variant stock, or overall stock). */
  maxStock: number;
  /** Per-branch availability so the cart can block/force-remove on branch switch. */
  branchStock?: BranchStock[];
  rating?: { average: number; count: number };
}

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
  totalQuantity: () => number;
}

const clampQty = (qty: number, max: number) => Math.min(Math.max(1, qty), Math.max(1, max));

/**
 * Client-only cart state (Zustand). Server state lives in React Query —
 * do not duplicate server data here.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === line.id);
          if (existing) {
            // Merge quantities but never exceed the (freshest) stock cap.
            const max = line.maxStock || existing.maxStock;
            return {
              lines: state.lines.map((l) =>
                l.id === line.id
                  ? {
                      ...l,
                      ...line,
                      maxStock: max,
                      quantity: clampQty(l.quantity + line.quantity, max),
                    }
                  : l,
              ),
            };
          }
          return {
            lines: [...state.lines, { ...line, quantity: clampQty(line.quantity, line.maxStock) }],
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.id === id ? { ...l, quantity: clampQty(quantity, l.maxStock) } : l,
          ),
        })),
      removeLine: (id) =>
        set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      removeMany: (ids) =>
        set((state) => ({ lines: state.lines.filter((l) => !ids.includes(l.id)) })),
      clear: () => set({ lines: [] }),
      totalQuantity: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "cart",
      version: 2,
      // v0 lines were thin; v1 lines lack `variantId` (can't sync to the BE cart).
      // Drop pre-v2 lines rather than ship un-syncable rows.
      migrate: (persisted, version) => {
        if (version < 2) return { lines: [] } as Partial<CartState>;
        return persisted as Partial<CartState>;
      },
    },
  ),
);
