import type { Metadata } from "next";
import { AccountVouchersPage } from "@/features/account/account-vouchers-page";

export const metadata: Metadata = { title: "Mã giảm giá của tôi | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountVouchersPage />
    </main>
  );
}
