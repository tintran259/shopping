"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { isWholesale } from "@/services/auth.service";

/**
 * Convenience view over the auth store. `mounted` gates against hydration mismatch:
 * the persisted session only rehydrates on the client, so render logged-out on the
 * server/first paint and switch once mounted.
 */
export function useAuth() {
  const store = useAuthStore();

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  const user = mounted ? store.user : null;
  return {
    mounted,
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
