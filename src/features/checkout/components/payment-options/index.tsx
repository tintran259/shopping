"use client";

import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";
import { PAYMENT_METHODS } from "../../constants";

/** Payment method picker (selection only — no real gateway in this mock). */
export function PaymentOptions() {
  const paymentMethodId = useCheckoutStore((s) => s.paymentMethodId);
  const update = useCheckoutStore((s) => s.update);

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Phương thức thanh toán</h2>

      <div className="mt-4 space-y-2">
        {PAYMENT_METHODS.map((m) => {
          const active = paymentMethodId === m.id;
          return (
            <label
              key={m.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                active ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30",
              )}
            >
              <input
                type="radio"
                name="payment-method"
                checked={active}
                onChange={() => update({ paymentMethodId: m.id })}
                className="size-4 accent-(--theme-btn-primary-bg,var(--primary))"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
