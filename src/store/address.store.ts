import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserAddress {
  id: string;
  /** Optional label, e.g. "Nhà riêng", "Công ty". */
  label?: string;
  recipientName: string;
  phone: string;
  provinceCode: string;
  province: string;
  districtCode: string;
  district: string;
  wardCode: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: UserAddress[];
  add: (a: Omit<UserAddress, "id">) => void;
  update: (id: string, patch: Partial<Omit<UserAddress, "id">>) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  clear: () => void;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `addr-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Ensure exactly one default: the marked one wins, else the first. */
function normalizeDefaults(list: UserAddress[], preferId?: string): UserAddress[] {
  if (list.length === 0) return list;
  const defId = preferId ?? list.find((a) => a.isDefault)?.id ?? list[0].id;
  return list.map((a) => ({ ...a, isDefault: a.id === defId }));
}

/**
 * Saved shipping addresses for the account (persisted, device-local in this mock).
 * Exactly one is the default. Checkout can later prefill from the default.
 */
export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: [],
      add: (a) =>
        set((s) => {
          const created: UserAddress = { ...a, id: uid() };
          const list = [...s.addresses, created];
          return { addresses: normalizeDefaults(list, a.isDefault ? created.id : undefined) };
        }),
      update: (id, patch) =>
        set((s) => {
          const list = s.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a));
          return { addresses: normalizeDefaults(list, patch.isDefault ? id : undefined) };
        }),
      remove: (id) =>
        set((s) => ({ addresses: normalizeDefaults(s.addresses.filter((a) => a.id !== id)) })),
      setDefault: (id) => set((s) => ({ addresses: normalizeDefaults(s.addresses, id) })),
      clear: () => set({ addresses: [] }),
    }),
    { name: "addresses" },
  ),
);
