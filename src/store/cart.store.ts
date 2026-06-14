import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (id: string) => void;
  clear: () => void;
  totalQuantity: () => number;
}

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
            return {
              lines: state.lines.map((l) =>
                l.id === line.id
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, line] };
        }),
      removeLine: (id) =>
        set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      totalQuantity: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    { name: "cart" },
  ),
);
