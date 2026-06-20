"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { useCheckoutStore } from "@/store/checkout.store";
import type { ShippingMethod } from "@/services/shipping.service";
import type { Branch } from "@/types/branch";

const feeLabel = (fee: number, currency: string) =>
  fee === 0 ? "Miễn phí" : formatPrice(fee, currency);

/** Choose home delivery (+ method) or pickup at the fulfilling branch. */
export function DeliveryOptions({
  branch,
  methods,
  currency = "VND",
}: {
  branch: Branch | null;
  methods: ShippingMethod[];
  currency?: string;
}) {
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const shippingMethodId = useCheckoutStore((s) => s.shippingMethodId);
  const update = useCheckoutStore((s) => s.update);
  const isDelivery = fulfillment === "delivery";

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Phương thức nhận hàng</h2>

      {/* Delivery vs pickup */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(["delivery", "pickup"] as const).map((f) => {
          const active = fulfillment === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => update({ fulfillment: f })}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                active
                  ? "border-(--theme-select-border,var(--primary)) bg-primary/5 ring-1 ring-(--theme-select-border,var(--primary))"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <span className="block text-sm font-semibold">
                {f === "delivery" ? "Giao tận nơi" : "Nhận tại chi nhánh"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {f === "delivery"
                  ? "Giao đến địa chỉ của bạn"
                  : "Đến lấy tại cửa hàng — miễn phí ship"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Delivery method list */}
      {isDelivery ? (
        <div className="mt-4 space-y-2">
          {methods.map((m) => {
            const active = shippingMethodId === m.id;
            return (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                  active
                    ? "border-(--theme-select-border,var(--primary)) ring-1 ring-(--theme-select-border,var(--primary))"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <input
                  type="radio"
                  name="shipping-method"
                  checked={active}
                  onChange={() => update({ shippingMethodId: m.id })}
                  className="size-4 accent-(--theme-btn-primary-bg,var(--primary))"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">{m.eta}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {feeLabel(m.fee, currency)}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          {branch ? (
            <>
              <p className="font-medium">{branch.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {branch.address}, {branch.city}
              </p>
              {branch.phone && (
                <p className="mt-0.5 text-xs text-muted-foreground">SĐT: {branch.phone}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Đổi chi nhánh nhận hàng ở bộ chọn chi nhánh trên đầu trang.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Chưa chọn chi nhánh.</p>
          )}
        </div>
      )}
    </section>
  );
}
