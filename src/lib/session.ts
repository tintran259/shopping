import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useVoucherStore } from "@/store/voucher.store";
import { useCheckoutStore } from "@/store/checkout.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useBranchStore } from "@/store/branch.store";
import { useOrderStore } from "@/store/order.store";
import { useAddressStore } from "@/store/address.store";

// Set to true for the duration of a logout so auth guards (AccountShell /
// AccountHubPage) don't race and redirect to /login before the hard reload lands.
let _loggingOut = false;
export const isLoggingOut = () => _loggingOut;

/**
 * Full client logout — returns the browser to a first-visit state:
 *  1. reset every in-memory store (so UI updates instantly), then
 *  2. wipe localStorage + sessionStorage (drops ALL persisted keys), then
 *  3. hard-redirect to `redirectTo` so React Query and any other in-memory
 *     state re-initialise from scratch — nothing of the previous user remains.
 *
 * The hard reload (vs. router.push) is what makes it truly "like the first time":
 * callers don't need their own navigation after this.
 */
export function logoutAndReset(redirectTo = "/") {
  _loggingOut = true;
  useAuthStore.getState().logout();
  useCartStore.getState().clear();
  useVoucherStore.getState().clear();
  useCheckoutStore.getState().reset();
  useWishlistStore.getState().reset();
  useBranchStore.getState().clear();
  useOrderStore.getState().clear();
  useAddressStore.getState().clear();

  if (typeof window === "undefined") return;
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // storage may be unavailable (private mode / blocked) — ignore.
  }
  // Full document load → fresh app: empty query cache, stores re-hydrate empty.
  window.location.assign(redirectTo);
}
