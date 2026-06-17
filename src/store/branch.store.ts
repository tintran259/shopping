import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  /** documentId/id of the chosen branch, or null until the visitor picks one. */
  selectedBranchId: string | null;
  select: (id: string) => void;
  clear: () => void;
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
    }),
    { name: "branch" },
  ),
);
