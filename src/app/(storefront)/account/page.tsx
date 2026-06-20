import type { Metadata } from "next";
import { AccountPage } from "@/features/account/account-page";

export const metadata: Metadata = { title: "Tài khoản | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountPage />
    </main>
  );
}
