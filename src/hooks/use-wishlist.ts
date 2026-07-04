"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  baseProductId,
  useWishlistStore,
  type WishlistItem,
  type WishlistList,
} from "@/store/wishlist.store";
import {
  addWishlistItem,
  createWishlist,
  deleteWishlist,
  fetchWishlists,
  mergeGuestWishlist,
  removeWishlistItem,
  renameWishlist,
  toWishlistItem,
  type ApiWishlist,
} from "@/services/wishlist.service";

const QK = ["wishlist"] as const;

// Merge runs once per token across ALL hook instances (every product card mounts
// this hook → a per-instance guard would fan out into many wishlist refetches).
const mergedTokens = new Set<string>();

export interface UseWishlist {
  lists: WishlistList[];
  /** True once the source is hydrated (local) / first fetch settled (account). */
  ready: boolean;
  /** Whether the account-backed source is in use (vs. the guest local store). */
  isAuthenticated: boolean;
  createList: (name: string) => Promise<string>;
  renameList: (id: string, name: string) => void;
  removeList: (id: string) => void;
  toggleItem: (listId: string, item: WishlistItem) => void;
}

const toUiList = (l: ApiWishlist): WishlistList => ({
  id: l.id,
  name: l.name,
  createdAt: Date.parse(l.createdAt) || 0,
  items: l.items.map(toWishlistItem),
});

/** Composite key for a BE wishlist item (matches the store's WishlistItem id). */
const apiItemKey = (i: ApiWishlist["items"][number]): string =>
  i.variantId ? `${i.product.id}:${i.variantId}` : i.product.id;

/**
 * One wishlist API for the whole app. Guests read/write the persisted Zustand
 * store; logged-in users read/write the BE via React Query (optimistic toggles).
 * On login the guest's lists are merged into the account exactly once.
 */
export function useWishlist(): UseWishlist {
  const token = useAuthStore((s) => s.token);
  const isAuth = !!token;
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  // ── Guest store ───────────────────────────────────────────────────────
  const localLists = useWishlistStore((s) => s.lists);

  // ── Account (BE) ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: QK,
    queryFn: () => fetchWishlists(token as string),
    enabled: isAuth && mounted,
    staleTime: 30_000,
  });
  const apiLists = useMemo(() => query.data ?? [], [query.data]);

  // listId → (composite item key → server itemId) for removals.
  const itemIdMap = useMemo(() => {
    const m = new Map<string, Map<string, string>>();
    for (const l of apiLists) {
      const inner = new Map<string, string>();
      for (const it of l.items) inner.set(apiItemKey(it), it.id);
      m.set(l.id, inner);
    }
    return m;
  }, [apiLists]);

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: QK }),
    [qc],
  );
  const patch = useCallback(
    (fn: (lists: ApiWishlist[]) => ApiWishlist[]) =>
      qc.setQueryData<ApiWishlist[]>(QK, (old) => fn(old ?? [])),
    [qc],
  );

  // Merge the guest's local lists once per login, guarded across all instances
  // (→ at most one merge + one refetch, not one per product card).
  useEffect(() => {
    if (!isAuth || !mounted || mergedTokens.has(token as string)) return;
    mergedTokens.add(token as string);
    void mergeGuestWishlist(token as string)
      .then((merged) => {
        if (merged) invalidate();
      })
      .catch(() => {});
  }, [isAuth, mounted, token, invalidate]);

  const createList = useCallback<UseWishlist["createList"]>(
    async (name) => {
      if (!isAuth) return useWishlistStore.getState().createList(name);
      const created = await createWishlist(token as string, name);
      await invalidate();
      return created.id;
    },
    [isAuth, token, invalidate],
  );

  const renameList = useCallback<UseWishlist["renameList"]>(
    (id, name) => {
      if (!isAuth) return useWishlistStore.getState().renameList(id, name);
      const clean = name.trim();
      if (!clean) return;
      patch((lists) => lists.map((l) => (l.id === id ? { ...l, name: clean } : l)));
      void renameWishlist(token as string, id, clean).catch(() => {}).finally(invalidate);
    },
    [isAuth, token, patch, invalidate],
  );

  const removeList = useCallback<UseWishlist["removeList"]>(
    (id) => {
      if (!isAuth) return useWishlistStore.getState().removeList(id);
      patch((lists) => lists.filter((l) => l.id !== id));
      void deleteWishlist(token as string, id).catch(() => {}).finally(invalidate);
    },
    [isAuth, token, patch, invalidate],
  );

  const toggleItem = useCallback<UseWishlist["toggleItem"]>(
    (listId, item) => {
      if (!isAuth) return useWishlistStore.getState().toggleItem(listId, item);
      const itemId = itemIdMap.get(listId)?.get(item.id);
      const productId = baseProductId(item.id);
      patch((lists) =>
        lists.map((l) => {
          if (l.id !== listId) return l;
          if (itemId) {
            return { ...l, items: l.items.filter((i) => i.id !== itemId) };
          }
          const optimistic: ApiWishlist["items"][number] = {
            id: `temp-${item.id}`,
            variantId: item.variantId ?? null,
            variantLabel: item.variantLabel ?? null,
            product: {
              id: productId,
              slug: item.slug,
              name: item.name,
              thumbnail: item.thumbnail,
              defaultVariantId: item.defaultVariantId ?? null,
              price: {
                amount: item.price.amount,
                compareAt: item.price.compareAt ?? null,
                currency: item.price.currency,
              },
              priceVaries: item.priceVaries ?? false,
              brand: item.brand ?? null,
              rating: item.rating,
              inStock: item.inStock,
              branchStock: item.branchStock ?? [],
              optionPreview: item.optionPreview,
            },
          };
          return { ...l, items: [...l.items, optimistic] };
        }),
      );
      const req = itemId
        ? removeWishlistItem(token as string, itemId)
        : addWishlistItem(token as string, productId, listId, item.variantId).then(
            () => undefined,
          );
      void req.catch(() => {}).finally(invalidate);
    },
    [isAuth, token, itemIdMap, patch, invalidate],
  );

  const lists = isAuth ? apiLists.map(toUiList) : localLists;
  const ready = mounted && (!isAuth || !query.isLoading);

  return { lists, ready, isAuthenticated: isAuth, createList, renameList, removeList, toggleItem };
}
