import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/types/product";

export interface WishlistList {
  id: string;
  name: string;
  items: ProductSummary[];
  createdAt: number;
}

interface WishlistState {
  lists: WishlistList[];
  /** Create a list, returns its id. */
  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  removeList: (id: string) => void;
  clearList: (id: string) => void;
  /** Add/remove a product within a specific list. */
  toggleItem: (listId: string, item: ProductSummary) => void;
  /** Wipe everything back to a single empty default list (used on logout). */
  reset: () => void;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `wl-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Client-only wishlist (Zustand, persisted). Starts empty — there is no auto
 * "default" list; the user creates their own. Supports multiple named lists; the
 * full `ProductSummary` is stored so list pages render without a refetch.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      lists: [],
      createList: (name) => {
        const id = uid();
        set((s) => ({
          lists: [...s.lists, { id, name: name.trim() || "Danh sách", items: [], createdAt: Date.now() }],
        }));
        return id;
      },
      renameList: (id, name) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)),
        })),
      removeList: (id) => set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),
      reset: () => set({ lists: [] }),
      clearList: (id) =>
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, items: [] } : l)) })),
      toggleItem: (listId, item) =>
        set((s) => ({
          lists: s.lists.map((l) => {
            if (l.id !== listId) return l;
            const exists = l.items.some((i) => i.id === item.id);
            return {
              ...l,
              items: exists ? l.items.filter((i) => i.id !== item.id) : [...l.items, item],
            };
          }),
        })),
    }),
    {
      name: "wishlist",
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const p = persisted as { items?: ProductSummary[]; lists?: WishlistList[] };
        let lists: WishlistList[] = Array.isArray(p?.lists) ? p.lists : [];
        // v<2: old single-list shape ({ items }) → one named list.
        if (version < 2 && Array.isArray(p?.items)) {
          lists = p.items.length
            ? [{ id: uid(), name: "Yêu thích", items: p.items, createdAt: Date.now() }]
            : [];
        }
        // v3: no more auto "default" list — keep it only if it holds items (now a normal list).
        lists = lists
          .filter((l) => l.id !== "default" || l.items.length > 0)
          .map((l) => (l.id === "default" ? { ...l, id: uid() } : l));
        return { lists };
      },
    },
  ),
);
