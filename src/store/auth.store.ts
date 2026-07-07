import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as loginRequest,
  registerPersonal as registerRequest,
  type AuthUser,
  type RegisterPersonalInput,
} from "@/services/auth.service";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: "idle" | "loading";
  error: string | null;
  /** True once the persisted store has finished rehydrating from localStorage. */
  _hasHydrated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (input: RegisterPersonalInput) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  _setHasHydrated: (v: boolean) => void;
}

/**
 * Auth session (persisted: token + user). Business vs personal is carried on the user;
 * B2B accounts are provisioned in the back office and log in here like anyone else.
 * Replaces the old mock `customer.store` — email/phone now come from the logged-in user.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      status: "idle",
      error: null,
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
      login: async (identifier, password) => {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await loginRequest(identifier, password);
          set({ token, user, status: "idle" });
          return true;
        } catch (e) {
          set({ status: "idle", error: e instanceof Error ? e.message : "Đăng nhập thất bại" });
          return false;
        }
      },
      register: async (input) => {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await registerRequest(input);
          set({ token, user, status: "idle" });
          return true;
        } catch (e) {
          set({ status: "idle", error: e instanceof Error ? e.message : "Đăng ký thất bại" });
          return false;
        }
      },
      logout: () => set({ token: null, user: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);
