"use client";

import { useAuthStore } from "@/store/auth.store";
import { isWholesale } from "@/services/auth.service";

/**
 * Convenience view over the auth store. `mounted` gates against hydration mismatch:
 * the persisted session only rehydrates on the client, so render logged-out on the
 * server/first paint and switch once mounted.
 */
export function useAuth() {
  const store = useAuthStore();
  // _hasHydrated is set synchronously by Zustand's onRehydrateStorage (localStorage
  // is sync), so it's true on the very first client render — no extra useEffect tick
  // needed. This avoids the skeleton flash that the old useState(false)+useEffect
  // pattern caused on every navigation (every AccountShell re-mount).
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const user = hasHydrated ? store.user : null;
  return {
    mounted: hasHydrated,
    user,
    isAuthenticated: !!user,
    isWholesale: isWholesale(user),
    status: store.status,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
}
