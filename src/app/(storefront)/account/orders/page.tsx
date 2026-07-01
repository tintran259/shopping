import type { Metadata } from "next";
import { AccountOrdersPage } from "@/features/account/account-orders-page";

export const metadata: Metadata = { title: "Đơn hàng của tôi | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountOrdersPage />
    </main>
  );
}
