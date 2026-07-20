import type { Metadata } from "next";
import { AccountSettingsPage } from "@/features/account/account-settings-page";

export const metadata: Metadata = { title: "Cài đặt tài khoản | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountSettingsPage />
    </main>
  );
}
