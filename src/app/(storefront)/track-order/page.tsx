import type { Metadata } from "next";
import { TrackOrderPage } from "@/features/orders/track-order-page";

export const metadata: Metadata = { title: "Tra cứu đơn hàng | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <TrackOrderPage />
    </main>
  );
}
