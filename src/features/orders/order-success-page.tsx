"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useOrderStore } from "@/store/order.store";
import { useAuthStore } from "@/store/auth.store";
import { QuickRegisterModal } from "@/features/auth/components/quick-register-modal";
import { OrderDetail } from "./components/order-detail";

export function OrderSuccessPage({ orderId }: { orderId: string }) {
  const getById = useOrderStore((s) => s.getById);
  const user = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  const order = mounted ? getById(orderId) : undefined;
  const isGuest = mounted && !user;

  // Auto-open the create-account popup once for guests with a valid order.
  const [showRegister, setShowRegister] = useState(false);
  const autoOpened = useRef(false);
  useEffect(() => {
    if (isGuest && order && !autoOpened.current) {
      autoOpened.current = true;
      setShowRegister(true);
    }
  }, [isGuest, order]);

  if (!mounted) {
    return <div className="mx-auto h-96 w-full max-w-2xl animate-pulse rounded-2xl bg-muted" />;
  }

  if (!order) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <p className="text-base font-medium">Không tìm thấy đơn hàng</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Đơn có thể đã được xem trên thiết bị khác. Thử tra cứu bằng mã đơn + số điện thoại.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/track-order" className={cn(buttonVariants())}>
            Tra cứu đơn hàng
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-(--theme-in-stock,#16a34a)/15 text-(--theme-in-stock,#15803d)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Đặt hàng thành công!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cảm ơn bạn đã mua sắm. Chúng tôi sẽ liên hệ để xác nhận đơn hàng sớm nhất.
        </p>
      </div>

      <div className="mt-6">
        <OrderDetail order={order} />
      </div>

      <QuickRegisterModal
        open={showRegister}
        defaults={{ name: order.recipientName, email: order.email, phone: order.phone }}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
}
