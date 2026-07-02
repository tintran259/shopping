"use client";

import { cn } from "@/lib/utils";

const SIZES = {
  /** Cart/wishlist line rows. */
  sm: { wrap: "h-9", btn: "w-9", count: "w-8" },
  /** Purchase surfaces (PDP, variant picker). */
  lg: { wrap: "h-11", btn: "w-10 text-lg", count: "w-9" },
} as const;

/**
 * − quantity + stepper shared by the cart rows, the PDP purchase box and the
 * variant picker. Dumb: enable/disable and limit feedback are the caller's —
 * e.g. the PDP keeps `+` enabled at max so it can flash its limit warning.
 */
export function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
  decreaseDisabled = false,
  increaseDisabled = false,
  size = "sm",
  className,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border",
        s.wrap,
        className,
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={decreaseDisabled}
        aria-label="Giảm"
        className={cn("flex h-full items-center justify-center disabled:opacity-40", s.btn)}
      >
        −
      </button>
      <span className={cn("text-center text-sm font-medium tabular-nums", s.count)}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={increaseDisabled}
        aria-label="Tăng"
        className={cn("flex h-full items-center justify-center disabled:opacity-40", s.btn)}
      >
        +
      </button>
    </div>
  );
}
