"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";

export function OrderSuccess({
  orderId,
  total,
  currency,
  isPickup,
  paymentLabel,
}: {
  orderId: string;
  total: number;
  currency: string;
  isPickup: boolean;
  paymentLabel: string;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-(--theme-in-stock,#16a34a)/15 text-(--theme-in-stock,#15803d)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Đặt hàng thành công!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cảm ơn bạn đã mua sắm. Chúng tôi sẽ liên hệ để xác nhận đơn hàng sớm nhất.
      </p>

      <dl className="mt-6 w-full space-y-2.5 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Mã đơn hàng</dt>
          <dd className="font-semibold">{orderId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Hình thức nhận</dt>
          <dd className="font-medium">{isPickup ? "Nhận tại chi nhánh" : "Giao tận nơi"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Thanh toán</dt>
          <dd className="font-medium">{paymentLabel}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2.5">
          <dt className="font-medium">Tổng cộng</dt>
          <dd className="text-base font-bold tabular-nums">{formatPrice(total, currency)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/c/dac-san" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          Tiếp tục mua sắm
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
