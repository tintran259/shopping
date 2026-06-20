import type { Metadata } from "next";
import { CmsSlot } from "@/cms/renderer/cms-slot";
import { getBranches } from "@/services/branch.service";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export const metadata: Metadata = { title: "Thanh toán | Shopping" };

export default async function Page() {
  const branches = await getBranches();
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
          Thanh toán
        </h1>
      </header>

      <CmsSlot slot="checkout-top" />
      <CheckoutPage branches={branches} />
      <CmsSlot slot="checkout-bottom" />
    </main>
  );
}
