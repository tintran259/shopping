import type { Metadata } from "next";
import { AccountReviewsPage } from "@/features/account/account-reviews-page";

export const metadata: Metadata = { title: "Đánh giá của tôi | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountReviewsPage />
    </main>
  );
}
