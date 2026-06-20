import type { Metadata } from "next";
import { AddressBookPage } from "@/features/account/address-book-page";

export const metadata: Metadata = { title: "Địa chỉ của tôi | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AddressBookPage />
    </main>
  );
}
