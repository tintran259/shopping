import type { Metadata } from "next";
import { AccountReturnsPage } from "@/features/account/account-returns-page";

export const metadata: Metadata = { title: "Đổi trả / Hoàn tiền | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountReturnsPage />
    </main>
  );
}
