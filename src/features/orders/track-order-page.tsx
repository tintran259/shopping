"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/store/order.store";
import type { OrderRecord } from "@/store/order.store";
import { OrderDetail } from "./components/order-detail";

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

export function TrackOrderPage() {
  const find = useOrderStore((s) => s.find);

  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderRecord | null>(null);
  const [searched, setSearched] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) return;
    setResult(find(code, phone) ?? null);
    setSearched(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit)">Tra cứu đơn hàng</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Nhập mã đơn và số điện thoại đặt hàng để xem trạng thái đơn.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mã đơn hàng</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DHXXXXXX" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Số điện thoại</label>
          <input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} />
        </div>
        <Button type="submit" size="lg" disabled={!code.trim() || !phone.trim()}>
          Tra cứu
        </Button>
      </form>

      <div className="mt-8">
        {result ? (
          <OrderDetail order={result} />
        ) : searched ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-base font-medium">Không tìm thấy đơn hàng</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kiểm tra lại mã đơn và số điện thoại. Đơn được tra cứu trên thiết bị đã đặt hàng.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
