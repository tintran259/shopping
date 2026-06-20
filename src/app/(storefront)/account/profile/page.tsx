import type { Metadata } from "next";
import { AccountProfilePage } from "@/features/account/account-profile-page";

export const metadata: Metadata = { title: "Hồ sơ | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountProfilePage />
    </main>
  );
}
