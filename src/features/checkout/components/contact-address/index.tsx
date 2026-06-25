"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";
import { useAddressStore } from "@/store/address.store";
import type { UserAddress } from "@/store/address.store";
import { AddressFields } from "@/components/shared/address-fields";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

const fullAddress = (a: UserAddress) =>
  [a.street, a.ward, a.province].filter(Boolean).join(", ");

/** Recipient contact + (for home delivery) the shipping address. Logged-in users with
 *  saved addresses get a quick-pick list; anyone can enter a new address instead. */
export function ContactAddress({ showErrors }: { showErrors: boolean }) {
  const { recipientName, phone, email, address, fulfillment, update, setAddress } =
    useCheckoutStore();
  const addresses = useAddressStore((s) => s.addresses);
  const isDelivery = fulfillment === "delivery";
  const hasSaved = addresses.length > 0;

  const missing = (v: string) => showErrors && !v.trim();
  const errCls = (v: string) => missing(v) && "border-destructive focus:border-destructive";

  const [manual, setManual] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fillFrom = (a: UserAddress) => {
    update({ recipientName: a.recipientName, phone: a.phone });
    setAddress({
      provinceCode: a.provinceCode,
      province: a.province,
      wardCode: a.wardCode,
      ward: a.ward,
      street: a.street,
    });
  };

  // On first mount: if there are saved addresses, pre-pick the default one.
  useEffect(() => {
    if (isDelivery && hasSaved && !manual && !selectedId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time default pick
      setSelectedId(def.id);
      fillFrom(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickSaved = (a: UserAddress) => {
    setSelectedId(a.id);
    setManual(false);
    fillFrom(a);
  };

  const goNew = () => {
    setManual(true);
    setSelectedId(null);
    setAddress({ provinceCode: "", province: "", wardCode: "", ward: "", street: "" });
  };

  const showList = isDelivery && hasSaved && !manual;

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Thông tin nhận hàng</h2>

      {showList ? (
        <>
          <div className="mt-4 space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                  selectedId === a.id
                    ? "border-(--theme-select-border,var(--primary)) ring-1 ring-(--theme-select-border,var(--primary))"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <input
                  type="radio"
                  name="saved-address"
                  checked={selectedId === a.id}
                  onChange={() => pickSaved(a)}
                  className="mt-1 size-4 accent-(--theme-btn-primary-bg,var(--primary))"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.recipientName}</span>
                    <span className="text-sm text-muted-foreground">{a.phone}</span>
                    {a.label && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {a.label}
                      </span>
                    )}
                    {a.isDefault && (
                      <span className="rounded-full bg-(--theme-success,#059669) px-2 py-0.5 text-[11px] font-semibold text-white">
                        Mặc định
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{fullAddress(a)}</span>
                </span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={goNew}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            + Giao đến địa chỉ khác
          </button>

          <div className="mt-4">
            <Label>Email (nhận xác nhận đơn)</Label>
            <input
              value={email}
              inputMode="email"
              onChange={(e) => update({ email: e.target.value })}
              placeholder="email@example.com"
              className={inputCls}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
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
            <div className="mt-4">
              <AddressFields value={address} onChange={setAddress} showErrors={showErrors} />
            </div>
          )}

          {isDelivery && hasSaved && (
            <button
              type="button"
              onClick={() => {
                const def = addresses.find((a) => a.isDefault) ?? addresses[0];
                pickSaved(def);
              }}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              ← Chọn từ địa chỉ đã lưu
            </button>
          )}
        </>
      )}
    </section>
  );
}
