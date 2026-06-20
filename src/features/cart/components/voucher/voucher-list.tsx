"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { amountToQualify, getVouchers, validateVoucher } from "@/services/voucher.service";

/** Available-vouchers picker shown under the code input (like Shopee/Tiki). */
export function VoucherList({
  subtotal,
  currency,
  appliedCode,
  onApply,
}: {
  subtotal: number;
  currency: string;
  appliedCode: string | null;
  onApply: (code: string) => void;
}) {
  return (
    <ul className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-2">
      {getVouchers().map((v) => {
        const eligible = validateVoucher(v, subtotal).ok;
        const need = amountToQualify(v, subtotal);
        const applied = appliedCode === v.code;
        return (
          <li key={v.code} className="flex items-center gap-3 rounded-md bg-background px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">
                {v.code} <span className="font-normal text-muted-foreground">· {v.label}</span>
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{v.description}</p>
              {!eligible && need > 0 && (
                <p className="text-[11px] text-(--theme-warning,#b45309)">
                  Mua thêm {formatPrice(need, currency)} để dùng
                </p>
              )}
            </div>
            {applied ? (
              <span className="shrink-0 text-[11px] font-medium text-(--theme-in-stock,#16a34a)">
                Đang dùng
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={!eligible}
                onClick={() => onApply(v.code)}
              >
                Áp dụng
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
