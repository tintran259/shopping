"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useBranchStore } from "@/store/branch.store";
import { useCartStore, type CartLine } from "@/store/cart.store";
import { toast } from "@/store/toast.store";
import {
  addCartItem,
  clearCart,
  fetchCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cart.service";

const QK = ["cart"] as const;

// Merge runs once per token across ALL hook instances. Every product card mounts
// this hook, so a per-instance guard would fan out into many cart refetches.
const mergedTokens = new Set<string>();

export interface UseCart {
  lines: CartLine[];
  totalQuantity: number;
  ready: boolean;
  isAuthenticated: boolean;
  addLine: (line: CartLine) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
}

const clampQty = (qty: number, max: number) => Math.min(Math.max(1, qty), Math.max(1, max));

/**
 * One cart API for the whole app. Guests read/write the persisted Zustand store;
 * logged-in users read/write the BE cart via React Query (optimistic updates,
 * branch-scoped). On login the guest's lines are replayed into the account once.
 */
export function useCart(): UseCart {
  const token = useAuthStore((s) => s.token);
  const isAuth = !!token;
  const branchId = useBranchStore((s) => s.selectedBranchId) ?? undefined;
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  // ── Guest store ───────────────────────────────────────────────────────
  const localLines = useCartStore((s) => s.lines);

  // ── Account (BE) ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: QK,
    queryFn: () => fetchCart(token as string),
    enabled: isAuth && mounted,
    staleTime: 30_000,
  });
  const apiLines = useMemo(() => query.data ?? [], [query.data]);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: QK }), [qc]);
  const patch = useCallback(
    (fn: (lines: CartLine[]) => CartLine[]) =>
      qc.setQueryData<CartLine[]>(QK, (old) => fn(old ?? [])),
    [qc],
  );

  // Replay the guest's local lines into the account cart once per login (guarded
  // across all instances → at most one merge + one refetch, not one per card).
  useEffect(() => {
    if (!isAuth || !mounted || mergedTokens.has(token as string)) return;
    mergedTokens.add(token as string);
    void mergeGuestCart(token as string, branchId)
      .then((merged) => {
        if (merged) invalidate();
      })
      .catch(() => { });
  }, [isAuth, mounted, token, branchId, invalidate]);

  const addLine = useCallback<UseCart["addLine"]>(
    (line) => {
      if (!isAuth) {
        const existing = useCartStore.getState().lines.find((l) => l.id === line.id);
        const cap = line.maxStock || existing?.maxStock || 99;
        const desired = (existing?.quantity ?? 0) + line.quantity;
        useCartStore.getState().addLine(line);
        if (desired > cap) toast.info(`Chỉ còn ${cap} sản phẩm — đã thêm tối đa vào giỏ`);
        return;
      }
      if (!line.variantId) return;
      patch((lines) => {
        const existing = lines.find((l) => l.variantId === line.variantId);
        if (existing) {
          return lines.map((l) =>
            l.variantId === line.variantId
              ? { ...l, quantity: clampQty(l.quantity + line.quantity, l.maxStock) }
              : l,
          );
        }
        return [...lines, { ...line, id: `temp-${line.variantId}`, quantity: clampQty(line.quantity, line.maxStock) }];
      });
      void addCartItem(token as string, line.variantId, line.quantity, branchId)
        .catch((e) => toast.error(e instanceof Error ? e.message : "Không thêm được vào giỏ"))
        .finally(invalidate);
    },
    [isAuth, token, branchId, patch, invalidate],
  );

  const setQuantity = useCallback<UseCart["setQuantity"]>(
    (id, quantity) => {
      if (!isAuth) return useCartStore.getState().setQuantity(id, quantity);
      patch((lines) =>
        lines.map((l) => (l.id === id ? { ...l, quantity: clampQty(quantity, l.maxStock) } : l)),
      );
      void updateCartItem(token as string, id, quantity)
        .catch((e) => toast.error(e instanceof Error ? e.message : "Không cập nhật được giỏ"))
        .finally(invalidate);
    },
    [isAuth, token, patch, invalidate],
  );

  const removeLine = useCallback<UseCart["removeLine"]>(
    (id) => {
      if (!isAuth) return useCartStore.getState().removeLine(id);
      patch((lines) => lines.filter((l) => l.id !== id));
      void removeCartItem(token as string, id).catch(() => { }).finally(invalidate);
    },
    [isAuth, token, patch, invalidate],
  );

  const removeMany = useCallback<UseCart["removeMany"]>(
    (ids) => {
      if (!isAuth) return useCartStore.getState().removeMany(ids);
      const set = new Set(ids);
      patch((lines) => lines.filter((l) => !set.has(l.id)));
      void Promise.all(ids.map((id) => removeCartItem(token as string, id).catch(() => { }))).finally(
        invalidate,
      );
    },
    [isAuth, token, patch, invalidate],
  );

  const clear = useCallback<UseCart["clear"]>(() => {
    if (!isAuth) return useCartStore.getState().clear();
    patch(() => []);
    void clearCart(token as string).catch(() => { }).finally(invalidate);
  }, [isAuth, token, patch, invalidate]);

  const lines = isAuth ? apiLines : localLines;
  const totalQuantity = lines.reduce((n, l) => n + l.quantity, 0);
  const ready = mounted && (!isAuth || !query.isLoading);

  return {
    lines,
    totalQuantity,
    ready,
    isAuthenticated: isAuth,
    addLine,
    setQuantity,
    removeLine,
    removeMany,
    clear,
  };
}
