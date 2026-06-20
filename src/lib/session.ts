import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useVoucherStore } from "@/store/voucher.store";
import { useCheckoutStore } from "@/store/checkout.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useBranchStore } from "@/store/branch.store";
import { useOrderStore } from "@/store/order.store";

/**
 * Full client logout: clear the auth session AND every other persisted store so
 * the next person on a shared device can't see the previous user's cart, saved
 * lists, checkout details (name/address/VAT), applied voucher, or branch.
 * Call this everywhere instead of `auth.logout()` alone.
 */
export function logoutAndReset() {
  useAuthStore.getState().logout();
  useCartStore.getState().clear();
  useVoucherStore.getState().clear();
  useCheckoutStore.getState().reset();
  useWishlistStore.getState().reset();
  useBranchStore.getState().clear();
  useOrderStore.getState().clear();
}
