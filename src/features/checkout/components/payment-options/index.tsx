"use client";

import { memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";
import { PAYMENT_METHODS } from "../../constants";

/** Payment method picker. COD + bank transfer work today; gateway methods (MoMo,
 *  card) are shown disabled ("Sắp có") until a real gateway/BE is integrated.
 *  Memoized so keystrokes in sibling checkout sections don't re-render it. */
export const PaymentOptions = memo(function PaymentOptions() {
  const paymentMethodId = useCheckoutStore((s) => s.paymentMethodId);
  const update = useCheckoutStore((s) => s.update);

  // Guard against a persisted selection that's now disabled/unknown.
  useEffect(() => {
    const m = PAYMENT_METHODS.find((x) => x.id === paymentMethodId);
    if (!m || m.comingSoon) update({ paymentMethodId: "cod" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Phương thức thanh toán</h2>

      <div className="mt-4 space-y-2">
        {PAYMENT_METHODS.map((m) => {
          if (m.comingSoon) {
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 opacity-60"
              >
                <span className="size-4 shrink-0 rounded-full border border-border" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">{m.description}</span>
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Sắp có
                </span>
              </div>
            );
          }
          const active = paymentMethodId === m.id;
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
});
