import type { Metadata } from "next";
import { OrderSuccessPage } from "@/features/orders/order-success-page";

export const metadata: Metadata = { title: "Đặt hàng thành công | Shopping" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <OrderSuccessPage orderId={id} />
    </main>
  );
}
