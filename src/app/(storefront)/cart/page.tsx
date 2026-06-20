import type { Metadata } from "next";
import { CmsSlot } from "@/cms/renderer/cms-slot";
import { CartPage } from "@/features/cart/cart-page";

export const metadata: Metadata = { title: "Giỏ hàng | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
          Giỏ hàng
        </h1>
      </header>

      <CmsSlot slot="cart-top" />
      <CartPage />
      <CmsSlot slot="cart-bottom" />
    </main>
  );
}
