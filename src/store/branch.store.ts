import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  /** documentId/id of the chosen branch, or null until the visitor picks one. */
  selectedBranchId: string | null;
  select: (id: string) => void;
  clear: () => void;
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
}

/**
 * Client-only selection of the active branch (Zustand, persisted to
 * localStorage). Only the *id* is stored — the branch records themselves are
 * server state (React Query / server fetch) and must not be duplicated here.
 *
 * The selected branch scopes commerce data across pages (stock, price, pickup,
 * delivery). Consumers resolve the id against the fetched branch list.
 */
export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      select: (id) => set({ selectedBranchId: id }),
      clear: () => set({ selectedBranchId: null }),
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "branch",
      // v1: branch ids became BE UUIDs. Drop any stale mock id ("hcm-q1", …) so
      // it isn't sent as `branchId` (BE rejects non-UUID → empty list).
      version: 1,
      migrate: () => ({ selectedBranchId: null }) as Partial<BranchState>,
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);
