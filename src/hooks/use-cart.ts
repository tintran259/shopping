"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useBranchStore } from "@/store/branch.store";
import { clampQty, useCartStore, type CartLine } from "@/store/cart.store";
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

// Per-line debounce for quantity writes: holding the +/- stepper updates the UI
// optimistically on every click but sends just the final quantity to the BE
// (one PATCH + one refetch), instead of one round-trip per click.
const qtyTimers = new Map<string, ReturnType<typeof setTimeout>>();
const QTY_WRITE_DELAY = 400;

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
  // Reconcile the cache with the server-truth cart returned by a mutation — this
  // replaces the follow-up GET that a plain invalidate would trigger.
  const setLines = useCallback(
    (lines: CartLine[]) => qc.setQueryData<CartLine[]>(QK, lines),
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
        .then(setLines)
        .catch((e) => {
          toast.error(e instanceof Error ? e.message : "Không thêm được vào giỏ");
          invalidate(); // optimistic guess may be wrong → pull server truth
        });
    },
    [isAuth, token, branchId, patch, setLines, invalidate],
  );

  const setQuantity = useCallback<UseCart["setQuantity"]>(
    (id, quantity) => {
      if (!isAuth) return useCartStore.getState().setQuantity(id, quantity);
      const current = qc.getQueryData<CartLine[]>(QK) ?? [];
      const clamped = clampQty(quantity, current.find((l) => l.id === id)?.maxStock ?? 99);
      // Instant optimistic UI…
      patch((lines) => lines.map((l) => (l.id === id ? { ...l, quantity: clamped } : l)));
      // …but coalesce the BE write: reset the timer on every click, send once idle.
      const prev = qtyTimers.get(id);
      if (prev) clearTimeout(prev);
      qtyTimers.set(
        id,
        setTimeout(() => {
          qtyTimers.delete(id);
          void updateCartItem(token as string, id, clamped)
            .then((lines) => {
              // Skip if the user has already queued a newer change for this line
              // (that write's response will be the authoritative one).
              if (!qtyTimers.has(id)) setLines(lines);
            })
            .catch((e) => {
              toast.error(e instanceof Error ? e.message : "Không cập nhật được giỏ");
              invalidate();
            });
        }, QTY_WRITE_DELAY),
      );
    },
    [isAuth, token, qc, patch, setLines, invalidate],
  );

  const removeLine = useCallback<UseCart["removeLine"]>(
    (id) => {
      if (!isAuth) return useCartStore.getState().removeLine(id);
      patch((lines) => lines.filter((l) => l.id !== id));
      void removeCartItem(token as string, id).then(setLines).catch(invalidate);
    },
    [isAuth, token, patch, setLines, invalidate],
  );

  const removeMany = useCallback<UseCart["removeMany"]>(
    (ids) => {
      if (!isAuth) return useCartStore.getState().removeMany(ids);
      const set = new Set(ids);
      patch((lines) => lines.filter((l) => !set.has(l.id)));
      // Fire all deletes; the last successful response is the final cart state.
      void Promise.all(
        ids.map((id) => removeCartItem(token as string, id).catch(() => null)),
      )
        .then((results) => {
          const last = results.filter((r): r is CartLine[] => r !== null).pop();
          if (last) setLines(last);
          else invalidate();
        })
        .catch(invalidate);
    },
    [isAuth, token, patch, setLines, invalidate],
  );

  const clear = useCallback<UseCart["clear"]>(() => {
    if (!isAuth) return useCartStore.getState().clear();
    patch(() => []);
    void clearCart(token as string).then(setLines).catch(invalidate);
  }, [isAuth, token, patch, setLines, invalidate]);

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
