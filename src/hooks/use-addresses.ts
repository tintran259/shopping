"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useAddressStore, type UserAddress } from "@/store/address.store";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  mergeGuestAddresses,
  updateAddress,
  type AddressInput,
} from "@/services/address.service";

const QK = ["addresses"] as const;

// Merge runs once per token across all hook instances (avoids repeated refetches).
const mergedTokens = new Set<string>();

export interface UseAddresses {
  addresses: UserAddress[];
  ready: boolean;
  isAuthenticated: boolean;
  add: (data: AddressInput) => void;
  update: (id: string, patch: Partial<AddressInput>) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
}

/** Exactly one default: the marked id wins, else the first. */
function normalizeDefaults(list: UserAddress[], preferId?: string): UserAddress[] {
  if (!list.length) return list;
  const defId = preferId ?? list.find((a) => a.isDefault)?.id ?? list[0].id;
  return list.map((a) => ({ ...a, isDefault: a.id === defId }));
}

/**
 * One address-book API for the whole app. Guests read/write the persisted Zustand
 * store; logged-in users read/write the BE via React Query (optimistic delete /
 * set-default). On login the guest's addresses are merged into the account once.
 */
export function useAddresses(): UseAddresses {
  const token = useAuthStore((s) => s.token);
  const isAuth = !!token;
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  // ── Guest store ───────────────────────────────────────────────────────
  const localAddresses = useAddressStore((s) => s.addresses);
  const localAdd = useAddressStore((s) => s.add);
  const localUpdate = useAddressStore((s) => s.update);
  const localRemove = useAddressStore((s) => s.remove);
  const localSetDefault = useAddressStore((s) => s.setDefault);

  // ── Account (BE) ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: QK,
    queryFn: () => fetchAddresses(token as string),
    enabled: isAuth && mounted,
    staleTime: 30_000,
  });
  const apiAddresses = useMemo(() => query.data ?? [], [query.data]);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: QK }), [qc]);
  const patch = useCallback(
    (fn: (list: UserAddress[]) => UserAddress[]) =>
      qc.setQueryData<UserAddress[]>(QK, (old) => fn(old ?? [])),
    [qc],
  );

  // Merge the guest's local addresses once per login, guarded across all instances.
  useEffect(() => {
    if (!isAuth || !mounted || mergedTokens.has(token as string)) return;
    mergedTokens.add(token as string);
    void mergeGuestAddresses(token as string)
      .then((merged) => {
        if (merged) invalidate();
      })
      .catch(() => {});
  }, [isAuth, mounted, token, invalidate]);

  const add = useCallback<UseAddresses["add"]>(
    (data) => {
      if (!isAuth) return localAdd(data);
      void createAddress(token as string, data).catch(() => { }).finally(invalidate);
    },
    [isAuth, token, localAdd, invalidate],
  );

  const update = useCallback<UseAddresses["update"]>(
    (id, p) => {
      if (!isAuth) return localUpdate(id, p);
      patch((list) =>
        normalizeDefaults(
          list.map((a) => (a.id === id ? { ...a, ...p } : a)),
          p.isDefault ? id : undefined,
        ),
      );
      void updateAddress(token as string, id, p).catch(() => { }).finally(invalidate);
    },
    [isAuth, token, localUpdate, patch, invalidate],
  );

  const remove = useCallback<UseAddresses["remove"]>(
    (id) => {
      if (!isAuth) return localRemove(id);
      patch((list) => normalizeDefaults(list.filter((a) => a.id !== id)));
      void deleteAddress(token as string, id).catch(() => { }).finally(invalidate);
    },
    [isAuth, token, localRemove, patch, invalidate],
  );

  const setDefault = useCallback<UseAddresses["setDefault"]>(
    (id) => {
      if (!isAuth) return localSetDefault(id);
      patch((list) => normalizeDefaults(list, id));
      void updateAddress(token as string, id, { isDefault: true })
        .catch(() => { })
        .finally(invalidate);
    },
    [isAuth, token, localSetDefault, patch, invalidate],
  );

  const addresses = isAuth ? apiAddresses : localAddresses;
  const ready = mounted && (!isAuth || !query.isLoading);

  return { addresses, ready, isAuthenticated: isAuth, add, update, remove, setDefault };
}
