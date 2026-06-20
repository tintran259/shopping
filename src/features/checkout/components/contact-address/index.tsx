"use client";

import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";
import { VN_PROVINCES } from "../../constants";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

/** Recipient contact + (for home delivery) the shipping address. */
export function ContactAddress({ showErrors }: { showErrors: boolean }) {
  const { recipientName, phone, email, address, fulfillment, update, setAddress } =
    useCheckoutStore();
  const isDelivery = fulfillment === "delivery";
  const missing = (v: string) => showErrors && !v.trim();
  const errCls = (v: string) => missing(v) && "border-destructive focus:border-destructive";

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Thông tin nhận hàng</h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Label required>Họ và tên</Label>
          <input
            value={recipientName}
            onChange={(e) => update({ recipientName: e.target.value })}
            placeholder="Nguyễn Văn A"
            className={cn(inputCls, errCls(recipientName))}
          />
        </div>
        <div>
          <Label required>Số điện thoại</Label>
          <input
            value={phone}
            inputMode="tel"
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="09xx xxx xxx"
            className={cn(inputCls, errCls(phone))}
          />
        </div>
        <div className="lg:col-span-2">
          <Label>Email (nhận xác nhận đơn)</Label>
          <input
            value={email}
            inputMode="email"
            onChange={(e) => update({ email: e.target.value })}
            placeholder="email@example.com"
            className={inputCls}
          />
        </div>
      </div>

      {isDelivery && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <Label required>Tỉnh / Thành phố</Label>
            <select
              value={address.province}
              onChange={(e) => setAddress({ province: e.target.value })}
              className={cn(inputCls, errCls(address.province))}
            >
              <option value="">— Chọn tỉnh / thành —</option>
              {VN_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Quận / Huyện</Label>
            <input
              value={address.district}
              onChange={(e) => setAddress({ district: e.target.value })}
              placeholder="Quận 1"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Phường / Xã</Label>
            <input
              value={address.ward}
              onChange={(e) => setAddress({ ward: e.target.value })}
              placeholder="Phường Bến Nghé"
              className={inputCls}
            />
          </div>
          <div className="lg:col-span-2">
            <Label required>Địa chỉ cụ thể</Label>
            <input
              value={address.street}
              onChange={(e) => setAddress({ street: e.target.value })}
              placeholder="Số nhà, tên đường"
              className={cn(inputCls, errCls(address.street))}
            />
          </div>
        </div>
      )}
    </section>
  );
}
