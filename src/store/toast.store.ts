import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

/** Transient toast notifications (not persisted). */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    // Skip if an identical toast is already on screen (avoids spam on retries).
    if (get().toasts.some((x) => x.message === t.message && x.type === t.type)) return;
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper — call from anywhere (services, query handlers, events). */
export const toast = {
  error: (message: string) => useToastStore.getState().push({ type: "error", message }),
  success: (message: string) => useToastStore.getState().push({ type: "success", message }),
  info: (message: string) => useToastStore.getState().push({ type: "info", message }),
};
